import type { ComprobanteTemplateInput, TipoComprobanteDemo } from '@taxigreen/comprobantes';
import { EstadoComprobante, Prisma, TipoComprobante, TipoPago } from '@taxigreen/database';

const comprobanteDemoSelect = {
  id: true,
  tipo: true,
  serie: true,
  correlativo: true,
  monto: true,
  estado: true,
} satisfies Prisma.comprobantesSelect;

export type ComprobanteDemoRecord = Prisma.comprobantesGetPayload<{
  select: typeof comprobanteDemoSelect;
}>;

export type PrepararComprobanteDemoResult = {
  comprobante: ComprobanteDemoRecord;
  created: boolean;
  montoFuente: 'pago' | 'cotizacion' | 'legacy_fallback' | 'existente';
};

type PagoMonto = {
  monto: Prisma.Decimal | number | string;
} | null;

const MONTO_LEGACY_COMPROBANTE = new Prisma.Decimal('75.00');

export function serieForTipoComprobante(tipo: TipoComprobante) {
  if (tipo === TipoComprobante.factura) return 'F001';
  if (tipo === TipoComprobante.ticket) return 'T001';
  return 'B001';
}

export function tipoComprobantePorPago(tipoPago: TipoPago) {
  return tipoPago === TipoPago.factura_empresa ? TipoComprobante.factura : TipoComprobante.boleta;
}

// F6: el tipo se decide por quién paga, no solo por el método.
// - empresa → factura al pagador corporativo (igual que factura_empresa hoy).
// - hotel → boleta (contrato actual; la factura al hotel vive en la liquidación, fuera de demo).
// - pasajero → factura solo si pidió factura o dejó RUC; boleta en el resto.
export function tipoComprobanteParaReserva(input: {
  responsablePago: string;
  tipoPago: TipoPago;
  requiereFactura?: boolean | null;
  pasajeroRuc?: string | null;
}) {
  if (input.responsablePago === 'empresa') return TipoComprobante.factura;
  if (input.responsablePago === 'hotel') return tipoComprobantePorPago(input.tipoPago);
  if (input.requiereFactura || input.pasajeroRuc) return TipoComprobante.factura;
  return TipoComprobante.boleta;
}

function decimalFrom(value: Prisma.Decimal | number | string) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function montoParaComprobante({
  pago,
  cotizacionMonto,
}: {
  pago?: PagoMonto;
  cotizacionMonto?: Prisma.Decimal | number | string | null;
}) {
  if (pago?.monto !== null && pago?.monto !== undefined) {
    return { monto: decimalFrom(pago.monto), fuente: 'pago' as const };
  }

  if (cotizacionMonto !== null && cotizacionMonto !== undefined) {
    return { monto: decimalFrom(cotizacionMonto), fuente: 'cotizacion' as const };
  }

  // Fallback legacy explícito: reservas antiguas pre-Feature 2 no tienen fila en `pagos`
  // ni cotización persistida. Mantener S/ 75 evita romper comprobantes históricos.
  return { monto: MONTO_LEGACY_COMPROBANTE, fuente: 'legacy_fallback' as const };
}

export async function prepararComprobanteDemo(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    reservaId: string;
    tipoPago: TipoPago;
    tipo?: TipoComprobante;
    pago?: PagoMonto;
    cotizacionMonto?: Prisma.Decimal | number | string | null;
  },
): Promise<PrepararComprobanteDemoResult> {
  const tipo = input.tipo ?? tipoComprobantePorPago(input.tipoPago);
  const serie = serieForTipoComprobante(tipo);

  const existing = await tx.comprobantes.findFirst({
    where: {
      reserva_id: input.reservaId,
      tipo,
    },
    orderBy: { created_at: 'desc' },
    select: comprobanteDemoSelect,
  });
  if (existing) {
    return { comprobante: existing, created: false, montoFuente: 'existente' };
  }

  const latest = await tx.comprobantes.findFirst({
    where: {
      tipo,
      serie,
    },
    orderBy: { correlativo: 'desc' },
    select: { correlativo: true },
  });
  const { monto, fuente } = montoParaComprobante({
    pago: input.pago,
    cotizacionMonto: input.cotizacionMonto,
  });

  const comprobante = await tx.comprobantes.create({
    data: {
      tenant_id: input.tenantId,
      reserva_id: input.reservaId,
      tipo,
      serie,
      correlativo: (latest?.correlativo ?? 0) + 1,
      monto,
      estado: EstadoComprobante.pendiente,
    },
    select: comprobanteDemoSelect,
  });

  return { comprobante, created: true, montoFuente: fuente };
}

type ComprobanteRecord = {
  id: string;
  tipo: TipoComprobanteDemo;
  serie: string;
  correlativo: number;
  monto: { toString(): string };
  estado: string;
  reserva: {
    pasajero_nombre: string;
    pasajero_dni: string | null;
    pasajero_ruc: string | null;
    empresa_nombre: string | null;
    origen_texto: string;
    destino_texto: string;
    punto_encuentro: string | null;
    vuelo_codigo: string | null;
    voucher_codigo: string;
  };
};

export function comprobanteToTemplateInput(comprobante: ComprobanteRecord): ComprobanteTemplateInput {
  return {
    id: comprobante.id,
    tipo: comprobante.tipo,
    serie: comprobante.serie,
    correlativo: comprobante.correlativo,
    monto: comprobante.monto.toString(),
    estado: comprobante.estado,
    pasajeroNombre: comprobante.reserva.pasajero_nombre,
    pasajeroDocumento: comprobante.reserva.pasajero_ruc ?? comprobante.reserva.pasajero_dni,
    empresaNombre: comprobante.reserva.empresa_nombre,
    origenTexto: comprobante.reserva.origen_texto,
    destinoTexto: comprobante.reserva.destino_texto,
    puntoEncuentro: comprobante.reserva.punto_encuentro,
    vueloCodigo: comprobante.reserva.vuelo_codigo,
    voucherCodigo: comprobante.reserva.voucher_codigo,
  };
}
