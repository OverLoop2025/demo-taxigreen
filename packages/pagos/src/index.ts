import { randomBytes } from 'node:crypto';
import {
  EstadoPago,
  Prisma,
  TipoPago,
  prisma,
  type pagos as PagoPrisma,
} from '@taxigreen/database';

const MONEDA_DEMO = 'PEN';
const TARIFA_FIJA_SIN_COORDENADAS = new Prisma.Decimal('75.00');
const TARIFA_BASE = 7.5;
const TARIFA_POR_KM = 3.2;
const FACTOR_RUTA_DEMO = 1.3;
const TARIFA_MINIMA = 15;

export type CotizacionDemoInput = {
  origenLat?: number | null;
  origenLng?: number | null;
  destinoLat?: number | null;
  destinoLng?: number | null;
  /** F8: categoría preferida — pondera la tarifa ANTES de congelar la cotización. */
  vehiculoPreferencia?: string | null;
  now?: Date;
};

// F8 (master §6.1): multiplicador determinista por categoría. La cotización
// congelada al confirmar ya lo incluye; nadie recalcula aguas abajo (C6).
const MULTIPLICADOR_VEHICULO: Record<string, number> = {
  sedan: 1,
  camioneta: 1.15,
  van: 1.4,
  minivan: 1.4,
};

function multiplicadorVehiculo(preferencia: string | null | undefined) {
  if (!preferencia) return 1;
  return MULTIPLICADOR_VEHICULO[preferencia] ?? 1;
}

export type CotizacionDemo = {
  monto: string;
  montoDecimal: Prisma.Decimal;
  moneda: typeof MONEDA_DEMO;
  fuente: 'coordenadas_demo' | 'tarifario_demo';
  distanciaKm: number | null;
  calculadaEn: Date;
  etiqueta: string;
};

export type AutorizarPagoDemoInput = {
  reservaId: string;
  tenantId: string;
  tipoPago: TipoPago;
  monto: Prisma.Decimal | number | string;
  moneda?: string;
  now?: Date;
};

export type CerrarPagoDemoInput = {
  reservaId: string;
  responsablePago?: 'pasajero' | 'empresa' | 'hotel' | string | null;
  now?: Date;
};

export type CapturarPagoPasajeroInput = {
  reservaId: string;
  accion: 'pagar_app' | 'confirmar_efectivo';
  now?: Date;
};

export type PagoResumen = {
  metodo: TipoPago | string;
  metodoLabel: string;
  estado: EstadoPago | string;
  estadoLabel: string;
  monto: string;
  moneda: string;
  montoEtiqueta: string;
  etiqueta: string;
};

type PagoLike = {
  tipo_pago: TipoPago | string;
  estado: EstadoPago | string;
  monto: Prisma.Decimal | number | string;
  moneda: string;
};

type PagoDb = {
  pagos: {
    upsert: (args: Prisma.pagosUpsertArgs) => Promise<PagoPrisma>;
    findUnique: (args: Prisma.pagosFindUniqueArgs) => Promise<PagoPrisma | null>;
    update: (args: Prisma.pagosUpdateArgs) => Promise<PagoPrisma>;
  };
};

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLatitude(value: number | null | undefined): value is number {
  return isFiniteNumber(value) && value >= -90 && value <= 90;
}

function isLongitude(value: number | null | undefined): value is number {
  return isFiniteNumber(value) && value >= -180 && value <= 180;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(
  origenLat: number,
  origenLng: number,
  destinoLat: number,
  destinoLng: number,
) {
  const radiusKm = 6371;
  const dLat = toRadians(destinoLat - origenLat);
  const dLng = toRadians(destinoLng - origenLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origenLat)) *
      Math.cos(toRadians(destinoLat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function decimalFrom(value: Prisma.Decimal | number | string) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function decimalToMoney(value: Prisma.Decimal | number | string) {
  return decimalFrom(value).toFixed(2);
}

export function formatMonto(monto: Prisma.Decimal | number | string, moneda = MONEDA_DEMO) {
  const amount = decimalToMoney(monto);
  if (moneda === 'PEN') return `S/ ${amount}`;
  return `${moneda} ${amount}`;
}

export function tipoPagoHumano(tipoPago: TipoPago | string) {
  switch (tipoPago) {
    case TipoPago.app_pago:
    case 'app_pago':
      return 'Pago por app';
    case TipoPago.voucher_hotel:
    case 'voucher_hotel':
      return 'Voucher hotel';
    case TipoPago.factura_empresa:
    case 'factura_empresa':
      return 'Factura empresa';
    case TipoPago.efectivo:
    case 'efectivo':
      return 'Efectivo';
    default:
      return 'Pago';
  }
}

export function estadoPagoHumano(pago: PagoLike | null | undefined) {
  if (!pago) return 'Pago por confirmar';
  const estado = String(pago.estado);
  const tipoPago = String(pago.tipo_pago);

  if (estado === EstadoPago.capturado) {
    return 'Pago cobrado';
  }

  if (estado === EstadoPago.por_liquidar) {
    if (tipoPago === TipoPago.voucher_hotel) {
      return 'Por liquidar con el hotel';
    }
    if (tipoPago === TipoPago.factura_empresa) {
      return 'Por liquidar con la empresa';
    }
    return 'Por liquidar';
  }

  if (estado === EstadoPago.por_cobrar) {
    if (tipoPago === TipoPago.app_pago) {
      return 'Pendiente de pago por app';
    }
    return 'Pendiente de pago en efectivo';
  }

  if (estado === EstadoPago.rechazado) {
    return 'Pago no autorizado';
  }

  if (estado === EstadoPago.autorizado) {
    if (tipoPago === TipoPago.voucher_hotel) {
      return 'Cargo al hotel autorizado';
    }
    if (tipoPago === TipoPago.factura_empresa) {
      return 'Crédito empresa autorizado';
    }
    if (tipoPago === TipoPago.efectivo) {
      return 'Pago en efectivo registrado';
    }
    return 'Pago por app autorizado';
  }

  return 'Pago por confirmar';
}

export function calcularCotizacionDemo(input: CotizacionDemoInput): CotizacionDemo {
  const calculadaEn = input.now ?? new Date();
  const { origenLat, origenLng, destinoLat, destinoLng } = input;
  const hasCoords =
    isLatitude(origenLat) &&
    isLongitude(origenLng) &&
    isLatitude(destinoLat) &&
    isLongitude(destinoLng);

  const factorVehiculo = multiplicadorVehiculo(input.vehiculoPreferencia);

  if (!hasCoords) {
    const montoFijo = new Prisma.Decimal(
      roundToHalf(TARIFA_FIJA_SIN_COORDENADAS.toNumber() * factorVehiculo).toFixed(2),
    );
    return {
      monto: montoFijo.toFixed(2),
      montoDecimal: montoFijo,
      moneda: MONEDA_DEMO,
      fuente: 'tarifario_demo',
      distanciaKm: null,
      calculadaEn,
      etiqueta: formatMonto(montoFijo),
    };
  }

  const haversine = haversineKm(
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
  );
  const distanciaDemo = haversine * FACTOR_RUTA_DEMO;
  const bruto = (TARIFA_BASE + TARIFA_POR_KM * distanciaDemo) * factorVehiculo;
  const monto = Math.max(TARIFA_MINIMA, roundToHalf(bruto));
  const montoDecimal = new Prisma.Decimal(monto.toFixed(2));

  return {
    monto: montoDecimal.toFixed(2),
    montoDecimal,
    moneda: MONEDA_DEMO,
    fuente: 'coordenadas_demo',
    distanciaKm: Number(distanciaDemo.toFixed(1)),
    calculadaEn,
    etiqueta: formatMonto(montoDecimal),
  };
}

function resolveAutorizacion(tipoPago: TipoPago, now: Date) {
  if (tipoPago === TipoPago.efectivo) {
    return {
      estado: EstadoPago.por_cobrar,
      proveedorDemo: 'efectivo_en_unidad',
      autorizacion: null,
      autorizadoEn: null,
      payload: {
        canal: 'efectivo_en_unidad',
        mensaje: 'Cobro pendiente para cerrar con el conductor.',
      },
    };
  }

  if (tipoPago === TipoPago.voucher_hotel) {
    return {
      estado: EstadoPago.autorizado,
      proveedorDemo: 'credito_hotel_demo',
      autorizacion: null,
      autorizadoEn: now,
      payload: {
        canal: 'credito_hotel_demo',
        mensaje: 'Cargo autorizado contra cuenta del hotel aliado.',
      },
    };
  }

  if (tipoPago === TipoPago.factura_empresa) {
    return {
      estado: EstadoPago.autorizado,
      proveedorDemo: 'credito_empresa_demo',
      autorizacion: null,
      autorizadoEn: now,
      payload: {
        canal: 'credito_empresa_demo',
        mensaje: 'Línea corporativa validada para facturación posterior.',
      },
    };
  }

  return {
    estado: EstadoPago.autorizado,
    proveedorDemo: 'pasarela_demo',
    autorizacion: `AUT-${randomBytes(3).toString('hex').toUpperCase()}`,
    autorizadoEn: now,
    payload: {
      canal: 'pasarela_demo',
      mensaje: 'Autorización demo aprobada.',
    },
  };
}

export async function autorizarPagoDemo(
  input: AutorizarPagoDemoInput,
  db: PagoDb = prisma,
) {
  const now = input.now ?? new Date();
  const monto = decimalFrom(input.monto);
  if (monto.lessThanOrEqualTo(0)) {
    throw new Error('El monto del pago demo debe ser mayor a cero.');
  }
  const resolved = resolveAutorizacion(input.tipoPago, now);

  return db.pagos.upsert({
    where: { reserva_id: input.reservaId },
    update: {
      tipo_pago: input.tipoPago,
      estado: resolved.estado,
      monto,
      moneda: input.moneda ?? MONEDA_DEMO,
      proveedor_demo: resolved.proveedorDemo,
      autorizacion: resolved.autorizacion,
      autorizado_en: resolved.autorizadoEn,
      capturado_en: null,
      payload_demo: resolved.payload satisfies Prisma.InputJsonValue,
    },
    create: {
      tenant_id: input.tenantId,
      reserva_id: input.reservaId,
      tipo_pago: input.tipoPago,
      estado: resolved.estado,
      monto,
      moneda: input.moneda ?? MONEDA_DEMO,
      proveedor_demo: resolved.proveedorDemo,
      autorizacion: resolved.autorizacion,
      autorizado_en: resolved.autorizadoEn,
      payload_demo: resolved.payload satisfies Prisma.InputJsonValue,
    },
  });
}

/**
 * Cierre financiero al finalizar un viaje.
 *
 * F6: el cierre ahora consulta `responsablePago`:
 * - hotel/empresa → `por_liquidar` (sin cambio vs pre-F6)
 * - pasajero → `por_cobrar` (antes era `capturado` automático — el pasajero debe pagar explícitamente)
 *
 * Idempotencia: si ya está `capturado` o `por_liquidar`, no retrocede.
 * Fail-safe: si `responsablePago` es null/undefined (legacy mock), trata como pasajero.
 */
export async function cerrarPagoDemo(input: CerrarPagoDemoInput, db: PagoDb = prisma) {
  const pago = await db.pagos.findUnique({ where: { reserva_id: input.reservaId } });
  if (!pago) return null;

  // Idempotencia: no retroceder un pago ya cerrado
  if (pago.estado === EstadoPago.capturado || pago.estado === EstadoPago.por_liquidar) {
    return pago;
  }

  const now = input.now ?? new Date();
  const responsable = input.responsablePago ?? 'pasajero'; // fail-safe

  // Convenio hotel/empresa → por_liquidar (crédito contra convenio, sin acto de pago del pasajero)
  // Pasajero → por_cobrar (el pasajero paga desde /p/[token] después)
  const esConvenio = responsable === 'hotel' || responsable === 'empresa';
  const estado = esConvenio ? EstadoPago.por_liquidar : EstadoPago.por_cobrar;

  return db.pagos.update({
    where: { reserva_id: input.reservaId },
    data: {
      estado,
      capturado_en: null, // nunca capturado automáticamente en F6
      payload_demo: {
        ...(pago.payload_demo && typeof pago.payload_demo === 'object' && !Array.isArray(pago.payload_demo)
          ? pago.payload_demo
          : {}),
        cierre: {
          estado,
          responsable_pago: responsable,
          ts: now.toISOString(),
        },
      } satisfies Prisma.InputJsonValue,
    },
  });
}

/**
 * Captura el pago de un pasajero que paga desde /p/[token].
 *
 * Solo aplica cuando el pago está en `por_cobrar` (post-cierre del viaje con responsable_pago=pasajero).
 * Para pagar_app: simula pasarela demo (determinista, sin latencia real).
 * Para confirmar_efectivo: el pasajero confirma que pagó en efectivo al conductor.
 *
 * Idempotencia: si ya está `capturado`, retorna el pago actual.
 * Error: si no está en `por_cobrar`, retorna null (llamador decide el HTTP).
 */
export async function capturarPagoPasajeroDemo(
  input: CapturarPagoPasajeroInput,
  db: PagoDb = prisma,
) {
  const pago = await db.pagos.findUnique({ where: { reserva_id: input.reservaId } });
  if (!pago) return { kind: 'no_pago' as const };

  // Idempotencia
  if (pago.estado === EstadoPago.capturado) {
    return { kind: 'ya_capturado' as const, pago };
  }

  // Solo se puede capturar un pago que está por_cobrar
  if (pago.estado !== EstadoPago.por_cobrar) {
    return { kind: 'no_cobrable' as const, estado: pago.estado };
  }

  const now = input.now ?? new Date();
  const proveedorDemo = input.accion === 'pagar_app' ? 'pasarela_demo' : 'efectivo_confirmado_pasajero';
  const autorizacion = input.accion === 'pagar_app'
    ? `CAP-${randomBytes(3).toString('hex').toUpperCase()}`
    : null;

  const updated = await db.pagos.update({
    where: { reserva_id: input.reservaId },
    data: {
      estado: EstadoPago.capturado,
      capturado_en: now,
      proveedor_demo: proveedorDemo,
      autorizacion: autorizacion ?? pago.autorizacion,
      payload_demo: {
        ...(pago.payload_demo && typeof pago.payload_demo === 'object' && !Array.isArray(pago.payload_demo)
          ? pago.payload_demo
          : {}),
        captura_pasajero: {
          accion: input.accion,
          proveedor: proveedorDemo,
          ts: now.toISOString(),
        },
      } satisfies Prisma.InputJsonValue,
    },
  });

  return { kind: 'capturado' as const, pago: updated };
}

/**
 * Anula un pago demo (para cancelaciones).
 * Solo anula si no está ya capturado.
 */
export async function anularPagoDemo(
  reservaId: string,
  db: PagoDb = prisma,
) {
  const pago = await db.pagos.findUnique({ where: { reserva_id: reservaId } });
  if (!pago) return null;

  // No anular un pago ya capturado
  if (pago.estado === EstadoPago.capturado) {
    return pago;
  }

  return db.pagos.update({
    where: { reserva_id: reservaId },
    data: {
      estado: EstadoPago.rechazado,
      payload_demo: {
        ...(pago.payload_demo && typeof pago.payload_demo === 'object' && !Array.isArray(pago.payload_demo)
          ? pago.payload_demo
          : {}),
        anulacion: {
          motivo: 'cancelacion_reserva',
          ts: new Date().toISOString(),
        },
      } satisfies Prisma.InputJsonValue,
    },
  });
}

export function serializarPagoDemo(input: {
  tipoPago: TipoPago | string;
  pago?: PagoLike | null;
  cotizacionMonto?: Prisma.Decimal | number | string | null;
  cotizacionMoneda?: string | null;
}): PagoResumen | null {
  const monto = input.pago?.monto ?? input.cotizacionMonto;
  if (monto === null || monto === undefined) return null;

  const moneda = input.pago?.moneda ?? input.cotizacionMoneda ?? MONEDA_DEMO;
  const estado = input.pago?.estado ?? EstadoPago.pendiente;
  const metodo = input.pago?.tipo_pago ?? input.tipoPago;
  const montoEtiqueta = formatMonto(monto, moneda);
  const estadoLabel = estadoPagoHumano({
    tipo_pago: metodo as TipoPago,
    estado: estado as EstadoPago,
    monto: decimalFrom(monto),
    moneda,
  });

  return {
    metodo,
    metodoLabel: tipoPagoHumano(metodo),
    estado,
    estadoLabel,
    monto: decimalToMoney(monto),
    moneda,
    montoEtiqueta,
    etiqueta: `${montoEtiqueta} · ${estadoLabel}`,
  };
}
