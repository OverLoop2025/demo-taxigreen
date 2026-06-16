'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { recordAudit } from '@taxigreen/auditoria';
import {
  CanalOrigen,
  EstadoReserva,
  PerfilPasajero,
  Prisma,
  ResponsablePago,
  TipoPago,
  TipoVehiculo,
  TipoViaje,
  prisma,
} from '@taxigreen/database';
import {
  extraccionReservaResultadoSchema,
  type ExtraccionReservaResultado,
  type ReservaExtraida,
} from '@taxigreen/ingesta';
import { sugerirAsignacionConRazonamiento } from '@taxigreen/ia';
import {
  autorizarPagoDemo,
  calcularCotizacionDemo,
  serializarPagoDemo,
  type PagoResumen,
} from '@taxigreen/pagos';
import { pagoChatHumano, resumenComercialHumano } from '@taxigreen/shared';
import { aceptarSugerenciaAsignacion } from '@/app/admin/reservas/[id]/actions';
import { requireRole } from '@/lib/auth';
import { estadoAbordajeInicial, requiereCounter } from '@/lib/conductor-asignacion';

export type PagoDemoChat = PagoResumen;

export type CrearReservaDesdeIngestaResult =
  | {
      ok: true;
      id: string;
      voucherCodigo: string;
      // Datos para la confirmación que el copiloto envía EN EL CHAT al cliente.
      // En A incluye pase de abordaje; en B entrega seguimiento directo.
      tokenPasajero: string;
      pasajeroNombre: string;
      puntoEncuentro: string | null;
      origenTexto: string;
      destinoTexto: string;
      fechaHoraServicioIso: string;
      tipoViaje: string;
      requiereMostrador: boolean;
      comercial: {
        perfilPasajero: string;
        responsablePago: string;
        convenioValidadoDemo: boolean;
        requiereFactura: boolean;
        resumen: string;
        pagoChat: string;
      };
      pago: PagoDemoChat;
    }
  | {
      ok: false;
      message: string;
      missing: string[];
    };

export type PrevisualizarPagoDesdeIngestaResult =
  | {
      ok: true;
      pago: PagoDemoChat;
      cotizacionFuente: 'coordenadas_demo' | 'tarifario_demo';
    }
  | { ok: false; message: string };

const REQUIRED_FIELDS: Array<[keyof ReservaExtraida, string]> = [
  ['tipo_viaje', 'tipo de viaje'],
  ['pasajero_nombre', 'nombre del pasajero'],
  ['pasajero_telefono', 'teléfono del pasajero'],
  ['origen_texto', 'origen'],
  ['destino_texto', 'destino'],
  ['fecha_hora_servicio', 'fecha y hora'],
  ['tipo_pago', 'tipo de pago'],
  ['perfil_pasajero', 'perfil del pasajero'],
  ['responsable_pago', 'responsable del pago'],
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
    throw new Error('No encontramos la empresa operativa. Revisa la carga inicial de datos.');
  }

  return tenant.id;
}

function nextVoucherCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TG-WA-${date}-${nanoid(5).toUpperCase()}`;
}

function parseFechaHoraServicio(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function cotizarReserva(reserva: ReservaExtraida) {
  return calcularCotizacionDemo({
    origenLat: reserva.origen_lat,
    origenLng: reserva.origen_lng,
    destinoLat: reserva.destino_lat,
    destinoLng: reserva.destino_lng,
    // F8: la preferencia de vehículo pondera la tarifa antes de congelarla.
    vehiculoPreferencia: reserva.vehiculo_preferencia,
  });
}

function identidadComercialDesdeReserva(reserva: ReservaExtraida) {
  const input = {
    perfilPasajero: reserva.perfil_pasajero ?? 'particular',
    responsablePago: reserva.responsable_pago ?? 'pasajero',
    convenioValidadoDemo: reserva.convenio_validado_demo,
    requiereFactura: reserva.requiere_factura,
    empresaNombre: reserva.empresa_nombre,
    hotelNombre: reserva.hotel_nombre,
    tipoPago: reserva.tipo_pago,
  };

  return {
    perfilPasajero: input.perfilPasajero,
    responsablePago: input.responsablePago,
    convenioValidadoDemo: Boolean(input.convenioValidadoDemo),
    requiereFactura: Boolean(input.requiereFactura),
    resumen: resumenComercialHumano(input),
    pagoChat: pagoChatHumano(input),
  };
}

export async function previsualizarPagoDesdeIngesta(
  extraccion: ExtraccionReservaResultado,
): Promise<PrevisualizarPagoDesdeIngestaResult> {
  await requireRole(['admin_tenant', 'despachador']);
  const parsed = extraccionReservaResultadoSchema.parse(extraccion);
  const reserva = parsed.reserva;
  // La tarifa SIEMPRE debe poder mostrarse en el resumen antes de confirmar. Si el
  // método de pago aún no está fijado, cotizamos asumiendo efectivo (el caso por
  // defecto del pasajero); el método final no cambia el monto cotizado.
  const tipoPago = reserva.tipo_pago ?? 'efectivo';

  const cotizacion = cotizarReserva(reserva);
  const pago = serializarPagoDemo({
    tipoPago,
    cotizacionMonto: cotizacion.montoDecimal,
    cotizacionMoneda: cotizacion.moneda,
  });

  if (!pago) return { ok: false, message: 'No se pudo calcular la tarifa.' };

  return {
    ok: true,
    pago,
    cotizacionFuente: cotizacion.fuente,
  };
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

  const fechaHoraServicio = parseFechaHoraServicio(reserva.fecha_hora_servicio);
  if (!fechaHoraServicio) {
    return {
      ok: false,
      message: 'La fecha y hora del servicio no es válida.',
      missing: ['fecha y hora válida'],
    };
  }

  const tenantId = await getDemoTenantId();
  const voucherCodigo = nextVoucherCode();
  const cotizacion = cotizarReserva(reserva);
  const tipoPago = reserva.tipo_pago as TipoPago;
  const perfilPasajero = (reserva.perfil_pasajero ?? PerfilPasajero.particular) as PerfilPasajero;
  const responsablePago = (reserva.responsable_pago ?? ResponsablePago.pasajero) as ResponsablePago;
  const vehiculoPreferencia = reserva.vehiculo_preferencia
    ? (reserva.vehiculo_preferencia as TipoVehiculo)
    : null;
  const identidad = identidadComercialDesdeReserva(reserva);
  const { created, pago } = await prisma.$transaction(async (tx) => {
    const createdReserva = await tx.reservas.create({
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
        fecha_hora_servicio: fechaHoraServicio,
        vuelo_codigo: reserva.vuelo_codigo,
        tipo_pago: tipoPago,
        perfil_pasajero: perfilPasajero,
        responsable_pago: responsablePago,
        convenio_validado_demo: reserva.convenio_validado_demo,
        requiere_factura: reserva.requiere_factura,
        vehiculo_preferencia: vehiculoPreferencia,
        pasajeros_cantidad: reserva.pasajeros_cantidad ?? reserva.pasajeros,
        equipaje_nivel: reserva.equipaje_nivel,
        estado: EstadoReserva.necesita_revision,
        estado_abordaje: estadoAbordajeInicial(reserva.tipo_viaje as TipoViaje),
        token_pasajero: `wa_${nanoid(21)}`,
        voucher_codigo: voucherCodigo,
        voucher_qr_payload: `wa-sim:${voucherCodigo}:${nanoid(8)}`,
        cotizacion_monto: cotizacion.montoDecimal,
        cotizacion_moneda: cotizacion.moneda,
        cotizacion_fuente: cotizacion.fuente,
        cotizacion_calculada_en: cotizacion.calculadaEn,
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
        tipo_viaje: true,
        perfil_pasajero: true,
        responsable_pago: true,
        convenio_validado_demo: true,
        requiere_factura: true,
      },
    });

    const pago = await autorizarPagoDemo(
      {
        reservaId: createdReserva.id,
        tenantId,
        tipoPago,
        monto: cotizacion.montoDecimal,
        moneda: cotizacion.moneda,
      },
      tx,
    );

    return { created: createdReserva, pago };
  });

  const pagoResumen = serializarPagoDemo({
    tipoPago,
    pago,
    cotizacionMonto: cotizacion.montoDecimal,
    cotizacionMoneda: cotizacion.moneda,
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
      comercial: identidad,
    },
    fuenteDecision: {
      fuente: parsed.fuente,
      motivo: parsed.motivo,
      modelo: parsed.modelo ?? null,
    },
  });

  await recordAudit({
    actor: { tipo: 'sistema', id: 'wa-sim' },
    action: 'pago_demo_autorizado',
    target: { table: 'pagos', id: pago.id },
    tenantId,
    payload: {
      reserva_id: created.id,
      tipo_pago: pago.tipo_pago,
      estado: pago.estado,
      monto: pago.monto.toFixed(2),
      moneda: pago.moneda,
      proveedor_demo: pago.proveedor_demo,
      autorizacion: pago.autorizacion,
      cotizacion_fuente: cotizacion.fuente,
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
    tipoViaje: created.tipo_viaje,
    requiereMostrador: requiereCounter(created.tipo_viaje),
    comercial: {
      ...identidad,
      perfilPasajero: created.perfil_pasajero,
      responsablePago: created.responsable_pago,
      convenioValidadoDemo: created.convenio_validado_demo,
      requiereFactura: created.requiere_factura,
    },
    pago: pagoResumen ?? {
      metodo: tipoPago,
      metodoLabel: 'Pago',
      estado: 'pendiente',
      estadoLabel: 'Pago por confirmar',
      monto: cotizacion.monto,
      moneda: cotizacion.moneda,
      montoEtiqueta: cotizacion.etiqueta,
      etiqueta: `${cotizacion.etiqueta} · Pago por confirmar`,
    },
  };
}

export type SeguimientoReserva = {
  voucherValidado: boolean;
  requiereMostrador: boolean;
  conductor: { nombre: string; placa: string | null } | null;
};

// Estado de trazabilidad que el chat consulta tras confirmar: en A el enlace se
// envía SOLO cuando el mostrador validó el pase; en B ya se envió al confirmar.
export async function obtenerSeguimientoReserva(reservaId: string): Promise<SeguimientoReserva> {
  await requireRole(['admin_tenant', 'despachador']);
  const reserva = await prisma.reservas.findFirst({
    where: { id: reservaId, deleted_at: null },
    select: {
      tipo_viaje: true,
      estado_abordaje: true,
      conductor: {
        select: {
          usuario: { select: { nombre: true } },
          vehiculo: { select: { placa: true } },
        },
      },
    },
  });
  if (!reserva) return { voucherValidado: false, requiereMostrador: true, conductor: null };
  const requiereMostrador = requiereCounter(reserva.tipo_viaje);

  return {
    requiereMostrador,
    voucherValidado: !requiereMostrador || reserva.estado_abordaje === 'autorizado',
    conductor: reserva.conductor
      ? {
          nombre: reserva.conductor.usuario.nombre,
          placa: reserva.conductor.vehiculo?.placa ?? null,
        }
      : null,
  };
}

export type BusquedaReservaResult =
  | { ok: true; codigo: string; nombre: string | null; link: string; estado: string }
  | { ok: false; error: 'no_encontrada' | 'acceso_denegado' };

export async function buscarReservaPorCodigo(codigo: string): Promise<BusquedaReservaResult> {
  await requireRole(['admin_tenant', 'despachador']);
  const codigoNormalizado = codigo.trim().toUpperCase();
  const reserva = await prisma.reservas.findFirst({
    where: {
      voucher_codigo: codigoNormalizado,
      deleted_at: null,
    },
    select: {
      id: true,
      voucher_codigo: true,
      pasajero_nombre: true,
      token_pasajero: true,
      estado: true,
    },
  });
  if (!reserva) return { ok: false, error: 'no_encontrada' };
  return {
    ok: true,
    codigo: reserva.voucher_codigo,
    nombre: reserva.pasajero_nombre,
    link: `/p/${reserva.token_pasajero}`,
    estado: reserva.estado,
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
