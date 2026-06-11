'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { recordAudit } from '@taxigreen/auditoria';
import {
  CanalOrigen,
  EstadoReserva,
  Prisma,
  TipoPago,
  TipoViaje,
  prisma,
} from '@taxigreen/database';
import {
  extraccionReservaResultadoSchema,
  type ExtraccionReservaResultado,
  type ReservaExtraida,
} from '@taxigreen/ingesta';
import { sugerirAsignacionConRazonamiento } from '@taxigreen/ia';
import { aceptarSugerenciaAsignacion } from '@/app/admin/reservas/[id]/actions';
import { requireRole } from '@/lib/auth';

export type CrearReservaDesdeIngestaResult =
  | {
      ok: true;
      id: string;
      voucherCodigo: string;
      // Datos para la confirmación que el copiloto envía EN EL CHAT al cliente:
      // enlace en vivo del pasajero (/p/[token]) + QR (lo escanea el counter).
      tokenPasajero: string;
      pasajeroNombre: string;
      puntoEncuentro: string | null;
      origenTexto: string;
      destinoTexto: string;
      fechaHoraServicioIso: string;
    }
  | {
      ok: false;
      message: string;
      missing: string[];
    };

const REQUIRED_FIELDS: Array<[keyof ReservaExtraida, string]> = [
  ['tipo_viaje', 'tipo de viaje'],
  ['pasajero_nombre', 'nombre del pasajero'],
  ['pasajero_telefono', 'teléfono del pasajero'],
  ['origen_texto', 'origen'],
  ['destino_texto', 'destino'],
  ['fecha_hora_servicio', 'fecha y hora'],
  ['tipo_pago', 'tipo de pago'],
];

function missingRequired(reserva: ReservaExtraida) {
  return REQUIRED_FIELDS.filter(([field]) => {
    const value = reserva[field];
    return value === null || value === '';
  }).map(([, label]) => label);
}

async function getDemoTenantId() {
  const tenant =
    (await prisma.tenants.findUnique({
      where: { nombre: 'Taxi Green Demo' },
      select: { id: true },
    })) ??
    (await prisma.tenants.findFirst({
      orderBy: { created_at: 'asc' },
      select: { id: true },
    }));

  if (!tenant) {
    throw new Error('No existe tenant demo. Ejecuta el seed de Sprint 1.');
  }

  return tenant.id;
}

function nextVoucherCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TG-WA-${date}-${nanoid(5).toUpperCase()}`;
}

export async function crearReservaDesdeIngesta(
  extraccion: ExtraccionReservaResultado,
): Promise<CrearReservaDesdeIngestaResult> {
  // Aunque el middleware protege /wa-sim, una Server Action puede invocarse por
  // POST directo: revalidamos rol aquí (humano en control + sin escritura abierta).
  await requireRole(['admin_tenant', 'despachador']);
  const parsed = extraccionReservaResultadoSchema.parse(extraccion);
  const reserva = parsed.reserva;
  const missing = missingRequired(reserva);
  if (missing.length > 0) {
    return {
      ok: false,
      message: 'Faltan datos obligatorios para crear la reserva.',
      missing,
    };
  }

  const tenantId = await getDemoTenantId();
  const voucherCodigo = nextVoucherCode();
  const created = await prisma.reservas.create({
    data: {
      tenant_id: tenantId,
      canal_origen: CanalOrigen.whatsapp_oficial,
      tipo_viaje: reserva.tipo_viaje as TipoViaje,
      solicitante_tipo: reserva.solicitante_tipo,
      solicitante_nombre: reserva.solicitante_nombre,
      solicitante_contacto: reserva.solicitante_contacto,
      pasajero_nombre: reserva.pasajero_nombre ?? '',
      pasajero_telefono: reserva.pasajero_telefono ?? '',
      pasajero_email: reserva.pasajero_email,
      pasajero_dni: reserva.pasajero_dni,
      pasajero_ruc: reserva.pasajero_ruc,
      origen_texto: reserva.origen_texto ?? '',
      origen_lat: reserva.origen_lat,
      origen_lng: reserva.origen_lng,
      destino_texto: reserva.destino_texto ?? '',
      destino_lat: reserva.destino_lat,
      destino_lng: reserva.destino_lng,
      punto_encuentro: reserva.punto_encuentro,
      fecha_hora_servicio: new Date(reserva.fecha_hora_servicio ?? ''),
      vuelo_codigo: reserva.vuelo_codigo,
      tipo_pago: reserva.tipo_pago as TipoPago,
      estado: EstadoReserva.necesita_revision,
      token_pasajero: `wa_${nanoid(21)}`,
      voucher_codigo: voucherCodigo,
      voucher_qr_payload: `wa-sim:${voucherCodigo}:${nanoid(8)}`,
      raw_ingesta: {
        canal: 'wa-sim',
        mensaje: reserva.raw_texto,
        resultado: parsed,
      } satisfies Prisma.InputJsonValue,
      sugerencia_copiloto: {
        fuente: parsed.fuente,
        motivo: parsed.motivo,
        confianza: parsed.confianza,
        modelo: parsed.modelo ?? null,
      } satisfies Prisma.InputJsonValue,
      hotel_nombre: reserva.hotel_nombre,
      empresa_nombre: reserva.empresa_nombre,
    },
    select: {
      id: true,
      voucher_codigo: true,
      token_pasajero: true,
      pasajero_nombre: true,
      punto_encuentro: true,
      origen_texto: true,
      destino_texto: true,
      fecha_hora_servicio: true,
    },
  });

  await recordAudit({
    actor: { tipo: 'sistema', id: 'wa-sim' },
    action: 'reserva_ingesta_whatsapp_creada',
    target: { table: 'reservas', id: created.id },
    tenantId,
    payload: {
      reserva_id: created.id,
      voucher_codigo: created.voucher_codigo,
      confianza: parsed.confianza,
      campos_extraidos: parsed.campos_extraidos,
      campos_esperados: parsed.campos_esperados,
    },
    fuenteDecision: {
      fuente: parsed.fuente,
      motivo: parsed.motivo,
      modelo: parsed.modelo ?? null,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/auditoria');
  revalidatePath('/admin/metricas');

  return {
    ok: true,
    id: created.id,
    voucherCodigo: created.voucher_codigo,
    tokenPasajero: created.token_pasajero,
    pasajeroNombre: created.pasajero_nombre,
    puntoEncuentro: created.punto_encuentro,
    origenTexto: created.origen_texto,
    destinoTexto: created.destino_texto,
    fechaHoraServicioIso: created.fecha_hora_servicio.toISOString(),
  };
}

export type SeguimientoReserva = {
  voucherValidado: boolean;
  conductor: { nombre: string; placa: string | null } | null;
};

// Estado de trazabilidad que el chat consulta tras confirmar: el enlace en vivo se
// envía al pasajero SOLO cuando el counter validó su pase (un solo uso), y el
// conductor aparece cuando el despacho (o el copiloto automático) lo asignó.
export async function obtenerSeguimientoReserva(reservaId: string): Promise<SeguimientoReserva> {
  await requireRole(['admin_tenant', 'despachador']);
  const reserva = await prisma.reservas.findFirst({
    where: { id: reservaId, deleted_at: null },
    select: {
      tenant_id: true,
      conductor: {
        select: {
          usuario: { select: { nombre: true } },
          vehiculo: { select: { placa: true } },
        },
      },
    },
  });
  if (!reserva) return { voucherValidado: false, conductor: null };

  const consumido = await prisma.auditoria.findFirst({
    where: {
      tenant_id: reserva.tenant_id,
      action: 'voucher_qr_consumido',
      target_table: 'reservas',
      target_id: reservaId,
    },
    select: { id: true },
  });

  return {
    voucherValidado: Boolean(consumido),
    conductor: reserva.conductor
      ? {
          nombre: reserva.conductor.usuario.nombre,
          placa: reserva.conductor.vehiculo?.placa ?? null,
        }
      : null,
  };
}

export type AsignacionAutomaticaResult =
  | { ok: true; conductorNombre: string; placa: string }
  | { ok: false; message: string };

// Modo copiloto: toma la MISMA sugerencia heurística del despacho y la acepta por
// la MISMA ruta auditada que usa el operador (broadcast al conductor incluido).
// La diferencia es quién confirma: aquí confirma el cliente en el chat, y queda
// trazado como decisión del copiloto automático.
export async function asignarConductorAutomatico(reservaId: string): Promise<AsignacionAutomaticaResult> {
  await requireRole(['admin_tenant', 'despachador']);
  const tenantId = await getDemoTenantId();

  const sugerencia = await sugerirAsignacionConRazonamiento(reservaId, { tenantId });
  if (!sugerencia) {
    return { ok: false, message: 'Sin conductores disponibles por ahora; el despacho lo tomará.' };
  }

  const formData = new FormData();
  formData.set('reserva_id', reservaId);
  formData.set('conductor_id', sugerencia.conductor.id);
  formData.set('vehiculo_id', sugerencia.vehiculo.id);
  formData.set('fuente', sugerencia.fuente);
  formData.set('motivo', 'copiloto_automatico_confirmado_por_cliente');
  formData.set('modelo', sugerencia.modelo ?? '');
  formData.set('razon', sugerencia.razon);
  formData.set('score', String(sugerencia.score));
  formData.set('factores_json', JSON.stringify(sugerencia.factores));

  const result = await aceptarSugerenciaAsignacion(formData);
  if (!result.ok) return { ok: false, message: result.message };

  return {
    ok: true,
    conductorNombre: sugerencia.conductor.nombre,
    placa: sugerencia.vehiculo.placa,
  };
}
