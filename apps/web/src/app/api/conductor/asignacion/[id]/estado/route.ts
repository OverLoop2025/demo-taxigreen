import { NextResponse } from 'next/server';
import { recordAudit } from '@taxigreen/auditoria';
import { EstadoViaje, Prisma, prisma } from '@taxigreen/database';
import { z } from 'zod';
import {
  estadoReservaParaViaje,
  serializeConductorAsignacion,
  timestampFieldForEstado,
  validarTransicionViaje,
} from '@/lib/conductor-asignacion';
import { findAsignacionForConductor } from '@/lib/conductor-asignacion-repository';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';
import { broadcastReservaEstado } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  estado_nuevo: z.nativeEnum(EstadoViaje),
});

function tripUpdateData(estadoNuevo: EstadoViaje, now: Date): Prisma.viajesUpdateInput {
  const timestampField = timestampFieldForEstado(estadoNuevo);
  if (timestampField === 'inicio_en_camino') return { estado: estadoNuevo, inicio_en_camino: now };
  if (timestampField === 'llegada_punto') return { estado: estadoNuevo, llegada_punto: now };
  if (timestampField === 'pasajero_a_bordo') return { estado: estadoNuevo, pasajero_a_bordo: now };
  if (timestampField === 'finalizado_en') return { estado: estadoNuevo, finalizado_en: now };
  return { estado: estadoNuevo };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = bearerTokenFromRequest(request);
  const session = bearer ? await verifyConductorToken(bearer) : null;
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  const { id } = await params;
  const estadoNuevo = parsed.data.estado_nuevo;
  const now = new Date();

  const transition = await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservas.findFirst({
      where: {
        id,
        tenant_id: session.tenantId,
        conductor_id: session.conductorId,
        deleted_at: null,
        conductor: {
          usuario: {
            id: session.userId,
            activo: true,
            deleted_at: null,
          },
        },
      },
      select: {
        id: true,
        voucher_codigo: true,
        estado: true,
        viajes: {
          where: {
            conductor_id: session.conductorId,
            deleted_at: null,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });

    if (!reserva) {
      return { kind: 'not_found' as const };
    }

    const viaje = reserva.viajes[0];
    if (!viaje) {
      return { kind: 'missing_trip' as const, voucherCodigo: reserva.voucher_codigo };
    }

    const validation = validarTransicionViaje(viaje.estado, estadoNuevo);
    if (!validation.ok) {
      return {
        kind: 'invalid_transition' as const,
        estadoActual: viaje.estado,
        estadoEsperado: validation.esperado,
      };
    }

    const estadoReserva = estadoReservaParaViaje(estadoNuevo);
    await tx.viajes.update({
      where: { id: viaje.id },
      data: tripUpdateData(estadoNuevo, now),
    });
    await tx.reservas.update({
      where: { id: reserva.id },
      data: { estado: estadoReserva },
    });

    return {
      kind: 'updated' as const,
      reservaId: reserva.id,
      voucherCodigo: reserva.voucher_codigo,
      viajeId: viaje.id,
      estadoAnterior: viaje.estado,
      estadoNuevo,
      estadoReservaAnterior: reserva.estado,
      estadoReserva,
    };
  });

  if (transition.kind === 'not_found') {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  if (transition.kind === 'missing_trip') {
    return NextResponse.json(
      { error: 'viaje_no_encontrado', voucher_codigo: transition.voucherCodigo },
      { status: 409 },
    );
  }

  if (transition.kind === 'invalid_transition') {
    return NextResponse.json(
      {
        error: 'transicion_invalida',
        estado_actual: transition.estadoActual,
        estado_esperado: transition.estadoEsperado,
      },
      { status: 409 },
    );
  }

  await recordAudit({
    actor: { tipo: 'conductor', id: session.conductorId },
    action: 'driver_estado_viaje_actualizado',
    target: { table: 'reservas', id },
    tenantId: session.tenantId,
    req: { headers: request.headers },
    payload: {
      reserva_id: transition.reservaId,
      voucher_codigo: transition.voucherCodigo,
      viaje_id: transition.viajeId,
      estado_viaje_anterior: transition.estadoAnterior,
      estado_viaje_nuevo: transition.estadoNuevo,
      estado_reserva_anterior: transition.estadoReservaAnterior,
      estado_reserva_nuevo: transition.estadoReserva,
    },
  });

  const broadcast = await broadcastReservaEstado({
    reservaId: transition.reservaId,
    viajeId: transition.viajeId,
    conductorId: session.conductorId,
    estadoReserva: transition.estadoReserva,
    estadoViaje: transition.estadoNuevo,
  });

  const updated = await findAsignacionForConductor(session, id);
  if (!updated) {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    broadcast,
    asignacion: serializeConductorAsignacion(updated),
  });
}
