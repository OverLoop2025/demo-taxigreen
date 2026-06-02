'use server';

import { revalidatePath } from 'next/cache';
import { recordAudit, type FuenteDecision } from '@taxigreen/auditoria';
import { EstadoReserva, EstadoViaje, Prisma, prisma } from '@taxigreen/database';
import { requireRole } from '@/lib/auth';
import { sendConductorAssignmentPush } from '@/lib/push';
import { broadcastConductorAsignacion, broadcastReservaAsignacion } from '@/lib/supabase/server';

type ActionResult = {
  ok: boolean;
  message: string;
};

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

async function requireAdminContext() {
  const session = await requireRole(['admin_tenant', 'despachador']);
  if (!session.user.tenantId) {
    throw new Error('La sesión no tiene tenant asociado.');
  }
  return {
    actorId: session.user.id,
    tenantId: session.user.tenantId,
  };
}

function revalidateReserva(reservaId: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/metricas');
  revalidatePath('/admin/auditoria');
  revalidatePath(`/admin/reservas/${reservaId}`);
}

async function asignarReserva({
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
}): Promise<ActionResult> {
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

  revalidateReserva(reservaId);
  return { ok: true, message: successMessage };
}

export async function asignarConductor(formData: FormData): Promise<ActionResult> {
  const { actorId, tenantId } = await requireAdminContext();
  const reservaId = value(formData, 'reserva_id');
  const conductorId = value(formData, 'conductor_id');
  const vehiculoId = value(formData, 'vehiculo_id') || null;

  return asignarReserva({
    actorId,
    tenantId,
    reservaId,
    conductorId,
    vehiculoId,
    fuenteDecision: null,
    successMessage: 'Reserva asignada y auditada.',
  });
}

export async function aceptarSugerenciaAsignacion(formData: FormData): Promise<ActionResult> {
  const { actorId, tenantId } = await requireAdminContext();
  const reservaId = value(formData, 'reserva_id');
  const conductorId = value(formData, 'conductor_id');
  const vehiculoId = value(formData, 'vehiculo_id') || null;
  const fuenteRaw = value(formData, 'fuente');
  const fuente: FuenteDecision['fuente'] = fuenteRaw === 'llm' ? 'llm' : 'algoritmo';
  const motivo = value(formData, 'motivo') || (fuente === 'llm' ? 'racionalizacion_llm' : 'heuristica_determinista');
  const modelo = value(formData, 'modelo') || null;
  const razon = value(formData, 'razon');
  const scoreRaw = Number(value(formData, 'score'));
  const score = Number.isFinite(scoreRaw) ? scoreRaw : null;
  const factoresJson = value(formData, 'factores_json');
  const factores = parseJsonObject(factoresJson);

  return asignarReserva({
    actorId,
    tenantId,
    reservaId,
    conductorId,
    vehiculoId,
    fuenteDecision: { fuente, motivo, modelo },
    payloadExtra: {
      origen: 'sugerencia_copiloto',
      razon_sugerida: razon,
      score_sugerido: score,
      factores_sugeridos: factores,
      override: false,
    },
    sugerenciaCopiloto: {
      fuente,
      motivo,
      modelo,
      razon,
      score,
      conductor_id: conductorId,
      vehiculo_id: vehiculoId,
      factores,
      aceptada_en: new Date().toISOString(),
    } satisfies Prisma.InputJsonObject,
    successMessage: 'Sugerencia aceptada, reserva asignada y decisión auditada.',
  });
}

function parseJsonObject(valueToParse: string): Prisma.InputJsonObject | null {
  if (!valueToParse) return null;
  try {
    const parsed = JSON.parse(valueToParse) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Prisma.InputJsonObject;
    }
  } catch {
    return null;
  }
  return null;
}

export async function registrarOverrideSugerencia(formData: FormData): Promise<ActionResult> {
  const { actorId, tenantId } = await requireAdminContext();
  const reservaId = value(formData, 'reserva_id');
  const razonOriginal = value(formData, 'razon_original_sugerida');
  const fuenteOriginal = value(formData, 'fuente_original') || 'algoritmo';
  const scoreRaw = Number(value(formData, 'score_original'));
  const scoreOriginal = Number.isFinite(scoreRaw) ? scoreRaw : null;

  if (!reservaId) {
    return { ok: false, message: 'No se pudo identificar la reserva.' };
  }

  const reserva = await prisma.reservas.findFirst({
    where: { id: reservaId, tenant_id: tenantId, deleted_at: null },
    select: { id: true, voucher_codigo: true },
  });
  if (!reserva) {
    return { ok: false, message: 'Reserva no encontrada.' };
  }

  await recordAudit({
    actor: { tipo: 'usuario', id: actorId },
    action: 'reserva_sugerencia_override',
    target: { table: 'reservas', id: reservaId },
    tenantId,
    payload: {
      reserva_id: reserva.id,
      voucher_codigo: reserva.voucher_codigo,
      override: true,
      fuente_original: fuenteOriginal,
      score_original: scoreOriginal,
      razon_original_sugerida: razonOriginal,
    },
    fuenteDecision: {
      fuente: 'algoritmo',
      motivo: 'override_humano',
      modelo: null,
    },
  });

  revalidateReserva(reservaId);
  return { ok: true, message: 'Override humano auditado. Puedes asignar manualmente abajo.' };
}

export async function asignarVehiculo(formData: FormData): Promise<ActionResult> {
  const { actorId, tenantId } = await requireAdminContext();
  const reservaId = value(formData, 'reserva_id');
  const vehiculoId = value(formData, 'vehiculo_id');

  if (!reservaId || !vehiculoId) {
    return { ok: false, message: 'Selecciona reserva y unidad.' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservas.findFirst({
      where: { id: reservaId, tenant_id: tenantId, deleted_at: null },
      select: {
        id: true,
        voucher_codigo: true,
        conductor_id: true,
      },
    });
    if (!reserva?.conductor_id) throw new Error('Primero asigna un conductor.');

    const vehiculo = await tx.vehiculos.findFirst({
      where: { id: vehiculoId, tenant_id: tenantId },
      select: {
        id: true,
        placa: true,
      },
    });
    if (!vehiculo) throw new Error('Vehículo no disponible.');

    const conductor = await tx.conductores.update({
      where: { id: reserva.conductor_id },
      data: { vehiculo_id: vehiculoId },
      select: { id: true, vehiculo_id: true },
    });

    return { reserva, conductor, vehiculo };
  });

  await recordAudit({
    actor: { tipo: 'usuario', id: actorId },
    action: 'vehiculo_asignado',
    target: { table: 'reservas', id: reservaId },
    tenantId,
    payload: {
      reserva_id: reservaId,
      voucher_codigo: result.reserva.voucher_codigo,
      conductor_id: result.conductor.id,
      vehiculo_id: result.vehiculo.id,
      placa: result.vehiculo.placa,
    },
    fuenteDecision: null,
  });

  const [reservaBroadcast, conductorBroadcast] = await Promise.all([
    broadcastReservaAsignacion({
      reservaId,
      conductorId: result.conductor.id,
      vehiculoId: result.conductor.vehiculo_id,
    }),
    broadcastConductorAsignacion({
      reservaId,
      conductorId: result.conductor.id,
      vehiculoId: result.conductor.vehiculo_id,
    }),
  ]);
  console.info('[driver-delivery]', {
    reservaId,
    conductorId: result.conductor.id,
    broadcastReserva: reservaBroadcast,
    broadcastConductor: conductorBroadcast,
    push: { ok: false, reason: 'vehiculo_update_without_push' },
  });

  revalidateReserva(reservaId);
  return { ok: true, message: 'Unidad actualizada y auditada.' };
}

export async function marcarExcepcion(formData: FormData): Promise<ActionResult> {
  const { actorId, tenantId } = await requireAdminContext();
  const reservaId = value(formData, 'reserva_id');
  const motivo = value(formData, 'motivo');

  if (!reservaId || !motivo) {
    return { ok: false, message: 'Describe la excepción operativa.' };
  }

  const updated = await prisma.reservas.updateMany({
    where: {
      id: reservaId,
      tenant_id: tenantId,
      deleted_at: null,
    },
    data: {
      estado: EstadoReserva.necesita_revision,
      sugerencia_copiloto: {
        excepcion_operativa: motivo,
        marcada_en: new Date().toISOString(),
        fuente: 'humano',
      } satisfies Prisma.InputJsonValue,
    },
  });

  if (updated.count !== 1) {
    return { ok: false, message: 'Reserva no encontrada.' };
  }

  await recordAudit({
    actor: { tipo: 'usuario', id: actorId },
    action: 'reserva_excepcion',
    target: { table: 'reservas', id: reservaId },
    tenantId,
    payload: { reserva_id: reservaId, motivo },
    fuenteDecision: null,
  });

  revalidateReserva(reservaId);
  return { ok: true, message: 'Excepción marcada para revisión.' };
}
