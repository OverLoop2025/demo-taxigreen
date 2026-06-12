import { recordAudit } from '@taxigreen/auditoria';
import {
  EstadoIncidencia,
  EstadoReserva,
  EstadoViaje,
  SeveridadIncidencia,
  TipologiaIncidencia,
  prisma,
} from '@taxigreen/database';
import { anularPagoDemo } from '@taxigreen/pagos';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { broadcastConductorAsignacion, broadcastReservaEstado } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  motivo: z.string().trim().max(300).optional(),
});

// Etapas de libertad del pasajero (master §5.3):
// - sin unidad           → cancela libre.
// - unidad asignada      → cancela con aviso (libera al conductor vía broadcast).
// - en camino / en punto → NO cancela sola: registra solicitud para el equipo.
// - a bordo en adelante  → solo soporte/incidencia (409).
type Etapa = 'libre' | 'con_aviso' | 'solicitud' | 'no_disponible';

function etapaCancelacion(reserva: {
  estado: EstadoReserva;
  conductor_id: string | null;
  viajes: Array<{ estado: EstadoViaje }>;
}): Etapa | 'ya_cancelada' {
  if (reserva.estado === EstadoReserva.cancelada) return 'ya_cancelada';
  const viaje = reserva.viajes[0] ?? null;
  if (
    reserva.estado === EstadoReserva.finalizada ||
    reserva.estado === EstadoReserva.por_liquidar ||
    viaje?.estado === EstadoViaje.finalizado ||
    viaje?.estado === EstadoViaje.a_bordo
  ) {
    return 'no_disponible';
  }
  if (viaje?.estado === EstadoViaje.en_camino || viaje?.estado === EstadoViaje.en_punto) {
    return 'solicitud';
  }
  if (reserva.conductor_id || viaje?.estado === EstadoViaje.asignado) return 'con_aviso';
  return 'libre';
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'solicitud_invalida' }, { status: 400 });
  }

  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      id: true,
      tenant_id: true,
      voucher_codigo: true,
      estado: true,
      conductor_id: true,
      pasajero_nombre: true,
      viajes: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { id: true, estado: true },
      },
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const etapa = etapaCancelacion(reserva);
  const motivo = parsed.data.motivo?.trim() || null;

  if (etapa === 'ya_cancelada') {
    return NextResponse.json({ ok: true, resultado: 'ya_cancelada' });
  }

  if (etapa === 'no_disponible') {
    return NextResponse.json({ error: 'cancelacion_no_disponible' }, { status: 409 });
  }

  if (etapa === 'solicitud') {
    // El conductor ya está en ruta: el equipo decide, no el sistema.
    const incidencia = await prisma.incidencias.create({
      data: {
        tenant_id: reserva.tenant_id,
        reserva_id: reserva.id,
        tipologia: TipologiaIncidencia.otro,
        severidad: SeveridadIncidencia.media,
        estado: EstadoIncidencia.abierta,
        descripcion: `El pasajero solicita cancelar el viaje${motivo ? `: ${motivo}` : ''}. La unidad ya está en ruta; requiere decisión del equipo.`,
        timeline: [
          {
            evento: 'cancelacion_solicitada_pasajero',
            motivo,
            ts: new Date().toISOString(),
          },
        ],
      },
      select: { id: true },
    });

    await recordAudit({
      actor: { tipo: 'pasajero', id: 'link_publico' },
      action: 'cancelacion_solicitada_pasajero',
      target: { table: 'incidencias', id: incidencia.id },
      tenantId: reserva.tenant_id,
      req: { headers: request.headers },
      payload: {
        reserva_id: reserva.id,
        voucher_codigo: reserva.voucher_codigo,
        motivo,
      },
    });

    return NextResponse.json({ ok: true, resultado: 'solicitud_registrada' });
  }

  // libre | con_aviso → cancelación efectiva en una transacción.
  const viaje = reserva.viajes[0] ?? null;
  const { pagoAnulado } = await prisma.$transaction(async (tx) => {
    await tx.reservas.update({
      where: { id: reserva.id },
      data: {
        estado: EstadoReserva.cancelada,
        cancelada_por: 'pasajero',
        cancelada_motivo: motivo,
      },
    });

    if (viaje && viaje.estado !== EstadoViaje.finalizado) {
      await tx.viajes.update({
        where: { id: viaje.id },
        data: { estado: EstadoViaje.cancelado },
      });
    }

    const pago = await anularPagoDemo(reserva.id, tx);
    return { pagoAnulado: pago?.estado === 'rechazado' ? pago : null };
  });

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_publico' },
    action: 'reserva_cancelada_pasajero',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    req: { headers: request.headers },
    payload: {
      reserva_id: reserva.id,
      voucher_codigo: reserva.voucher_codigo,
      etapa,
      motivo,
      conductor_liberado: reserva.conductor_id,
    },
  });

  if (pagoAnulado) {
    await recordAudit({
      actor: { tipo: 'sistema', id: 'cancelacion_reserva' },
      action: 'pago_demo_anulado_cancelacion',
      target: { table: 'pagos', id: pagoAnulado.id },
      tenantId: reserva.tenant_id,
      payload: {
        reserva_id: reserva.id,
        voucher_codigo: reserva.voucher_codigo,
        estado: pagoAnulado.estado,
      },
    });
  }

  // Best-effort: los broadcasts jamás rompen una cancelación ya persistida.
  await Promise.allSettled([
    viaje && reserva.conductor_id
      ? broadcastReservaEstado({
          reservaId: reserva.id,
          viajeId: viaje.id,
          conductorId: reserva.conductor_id,
          estadoReserva: EstadoReserva.cancelada,
          estadoViaje: EstadoViaje.cancelado,
        })
      : Promise.resolve(null),
    reserva.conductor_id
      ? broadcastConductorAsignacion({
          reservaId: reserva.id,
          conductorId: reserva.conductor_id,
          vehiculoId: null,
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ ok: true, resultado: 'cancelada', etapa });
}
