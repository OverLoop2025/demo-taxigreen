import { recordAudit, type FuenteDecision } from '@taxigreen/auditoria';
import { EstadoReserva, EstadoViaje, Prisma, prisma } from '@taxigreen/database';
import { sendConductorAssignmentPush } from '@/lib/push';
import { broadcastConductorAsignacion, broadcastReservaAsignacion } from '@/lib/supabase/server';

export type AsignacionResult = {
  ok: boolean;
  message: string;
};

/**
 * Núcleo de asignación de conductor/unidad a una reserva, COMPARTIDO por el panel admin
 * (`/admin/reservas/[id]`) y el mostrador (`/counter`). No valida rol ni sesión: el caller
 * (server action o route handler) ya autenticó y resolvió `actorId`/`tenantId`. Mantiene
 * una sola fuente de verdad para la transacción + auditoría + broadcast/push al conductor.
 */
export async function asignarReservaCore({
  actorId,
  tenantId,
  reservaId,
  conductorId,
  vehiculoId,
  fuenteDecision,
  payloadExtra,
  sugerenciaCopiloto,
  successMessage,
}: {
  actorId: string;
  tenantId: string;
  reservaId: string;
  conductorId: string;
  vehiculoId: string | null;
  fuenteDecision: FuenteDecision | null;
  payloadExtra?: Prisma.InputJsonObject;
  sugerenciaCopiloto?: Prisma.InputJsonValue;
  successMessage: string;
}): Promise<AsignacionResult> {
  if (!reservaId || !conductorId) {
    return { ok: false, message: 'Selecciona una reserva y un conductor.' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservas.findFirst({
      where: { id: reservaId, tenant_id: tenantId, deleted_at: null },
      select: {
        id: true,
        voucher_codigo: true,
        conductor_id: true,
        estado: true,
      },
    });
    if (!reserva) throw new Error('Reserva no encontrada.');

    // Coherencia: no se cambia conductor/unidad si la reserva ya está cerrada,
    // cancelada o el viaje está en curso (el pasajero ya va en ruta).
    if (
      reserva.estado === EstadoReserva.cancelada ||
      reserva.estado === EstadoReserva.por_liquidar ||
      reserva.estado === EstadoReserva.en_curso
    ) {
      throw new Error('Esta reserva ya no admite cambio de conductor ni unidad.');
    }

    const conductor = await tx.conductores.findFirst({
      where: {
        id: conductorId,
        tenant_id: tenantId,
        usuario: { activo: true, deleted_at: null },
      },
      select: {
        id: true,
        vehiculo_id: true,
      },
    });
    if (!conductor) throw new Error('Conductor no disponible.');

    if (vehiculoId) {
      const vehiculo = await tx.vehiculos.findFirst({
        where: { id: vehiculoId, tenant_id: tenantId },
        select: { id: true },
      });
      if (!vehiculo) throw new Error('Vehículo no disponible.');

      await tx.conductores.update({
        where: { id: conductorId },
        data: { vehiculo_id: vehiculoId },
      });
    }

    const updated = await tx.reservas.update({
      where: { id: reservaId },
      data: {
        conductor_id: conductorId,
        estado: EstadoReserva.asignada,
        ...(sugerenciaCopiloto ? { sugerencia_copiloto: sugerenciaCopiloto } : {}),
      },
      select: {
        id: true,
        voucher_codigo: true,
        conductor_id: true,
        estado: true,
      },
    });

    const viaje = await tx.viajes.findFirst({
      where: { reserva_id: reservaId, tenant_id: tenantId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });

    if (viaje) {
      await tx.viajes.update({
        where: { id: viaje.id },
        data: {
          conductor_id: conductorId,
          estado: EstadoViaje.asignado,
        },
      });
    } else {
      await tx.viajes.create({
        data: {
          tenant_id: tenantId,
          reserva_id: reservaId,
          conductor_id: conductorId,
          estado: EstadoViaje.asignado,
        },
      });
    }

    return {
      previousConductorId: reserva.conductor_id,
      previousEstado: reserva.estado,
      reserva: updated,
      vehiculoId: vehiculoId ?? conductor.vehiculo_id,
    };
  });

  const payload: Prisma.InputJsonObject = {
    reserva_id: reservaId,
    voucher_codigo: result.reserva.voucher_codigo,
    conductor_id: result.reserva.conductor_id,
    vehiculo_id: result.vehiculoId,
    estado: result.reserva.estado,
    anterior: {
      conductor_id: result.previousConductorId,
      estado: result.previousEstado,
    },
    ...(payloadExtra ?? {}),
  };

  await recordAudit({
    actor: { tipo: 'usuario', id: actorId },
    action: 'reserva_asignada',
    target: { table: 'reservas', id: reservaId },
    tenantId,
    payload,
    fuenteDecision,
  });

  const assignedConductorId = result.reserva.conductor_id ?? conductorId;
  const deliveryResults = await Promise.all([
    broadcastReservaAsignacion({
      reservaId,
      conductorId: assignedConductorId,
      vehiculoId: result.vehiculoId,
    }),
    broadcastConductorAsignacion({
      reservaId,
      conductorId: assignedConductorId,
      vehiculoId: result.vehiculoId,
    }),
    sendConductorAssignmentPush({
      tenantId,
      reservaId,
      conductorId: assignedConductorId,
      vehiculoId: result.vehiculoId,
    }),
  ]);
  console.info('[driver-delivery]', {
    reservaId,
    conductorId: assignedConductorId,
    broadcastReserva: deliveryResults[0],
    broadcastConductor: deliveryResults[1],
    push: deliveryResults[2],
  });

  return { ok: true, message: successMessage };
}
