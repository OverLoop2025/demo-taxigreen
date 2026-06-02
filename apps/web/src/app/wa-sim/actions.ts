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
import { requireRole } from '@/lib/auth';

export type CrearReservaDesdeIngestaResult =
  | {
      ok: true;
      id: string;
      voucherCodigo: string;
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

  return { ok: true, id: created.id, voucherCodigo: created.voucher_codigo };
}
