import { NextResponse } from 'next/server';
import { recordAudit } from '@taxigreen/auditoria';
import { EstadoReserva, EstadoViaje, prisma } from '@taxigreen/database';
import { z } from 'zod';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';
import { broadcastConductorAsignacion, broadcastReservaEstado } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Motivos cerrados (la UI los presenta como opciones); el comentario es libre.
const MOTIVOS = [
  'problema_mecanico',
  'no_llego_a_tiempo',
  'emergencia_personal',
  'error_de_asignacion',
  'otro',
] as const;

const bodySchema = z.object({
  motivo: z.enum(MOTIVOS),
  comentario: z.string().trim().max(300).optional(),
});

// Cancelable solo antes de tener al pasajero a bordo: después es una incidencia.
const ESTADOS_CANCELABLES: EstadoViaje[] = [
  EstadoViaje.asignado,
  EstadoViaje.en_camino,
  EstadoViaje.en_punto,
];

// F7 (master §5.4): el conductor cancela CON MOTIVO. La reserva NO muere: vuelve a
// `confirmada` sin conductor ("necesita nueva unidad") y conserva su estado de
// abordaje — una luz verde del mostrador sigue siendo válida para la nueva unidad.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = bearerTokenFromRequest(request);
  const session = bearer ? await verifyConductorToken(bearer) : null;
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'motivo_requerido' }, { status: 400 });
  }

  const { id } = await params;
  const { motivo, comentario } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservas.findFirst({
      where: {
        id,
        tenant_id: session.tenantId,
        conductor_id: session.conductorId,
        deleted_at: null,
      },
      select: {
        id: true,
        voucher_codigo: true,
        estado_abordaje: true,
        viajes: {
          where: { conductor_id: session.conductorId, deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { id: true, estado: true },
        },
      },
    });

    if (!reserva) return { kind: 'not_found' as const };

    const viaje = reserva.viajes[0];
    if (!viaje || !ESTADOS_CANCELABLES.includes(viaje.estado)) {
      return {
        kind: 'no_cancelable' as const,
        estadoViaje: viaje?.estado ?? null,
      };
    }

    await tx.viajes.update({
      where: { id: viaje.id },
      data: { estado: EstadoViaje.cancelado },
    });
    await tx.reservas.update({
      where: { id: reserva.id },
      data: {
        estado: EstadoReserva.confirmada,
        conductor_id: null,
      },
    });

    await tx.auditoria.create({
      data: {
        tenant_id: session.tenantId,
        actor_tipo: 'conductor',
        actor_id: session.conductorId,
        action: 'viaje_cancelado_por_conductor',
        target_table: 'viajes',
        target_id: viaje.id,
        payload: {
          reserva_id: reserva.id,
          voucher_codigo: reserva.voucher_codigo,
          motivo,
          comentario: comentario ?? null,
          estado_viaje_anterior: viaje.estado,
          estado_abordaje_conservado: reserva.estado_abordaje,
        },
      },
    });

    return {
      kind: 'cancelado' as const,
      reservaId: reserva.id,
      voucherCodigo: reserva.voucher_codigo,
      viajeId: viaje.id,
    };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  if (result.kind === 'no_cancelable') {
    return NextResponse.json(
      { error: 'viaje_no_cancelable', estado_viaje: result.estadoViaje },
      { status: 409 },
    );
  }

  await recordAudit({
    actor: { tipo: 'conductor', id: session.conductorId },
    action: 'reserva_requiere_reasignacion',
    target: { table: 'reservas', id: result.reservaId },
    tenantId: session.tenantId,
    req: { headers: request.headers },
    payload: {
      reserva_id: result.reservaId,
      voucher_codigo: result.voucherCodigo,
      motivo,
    },
  });

  // Best-effort: el pasajero ve el cambio en vivo; el despacho ve la bandeja.
  await Promise.allSettled([
    broadcastReservaEstado({
      reservaId: result.reservaId,
      viajeId: result.viajeId,
      conductorId: session.conductorId,
      estadoReserva: EstadoReserva.confirmada,
      estadoViaje: EstadoViaje.cancelado,
    }),
    broadcastConductorAsignacion({
      reservaId: result.reservaId,
      conductorId: session.conductorId,
      vehiculoId: null,
    }),
  ]);

  return NextResponse.json({ ok: true, resultado: 'cancelado' });
}
