import { describe, expect, it, vi } from 'vitest';
import { Prisma, TipoComprobante, TipoPago } from '@taxigreen/database';
import {
  prepararComprobanteDemo,
  serieForTipoComprobante,
  tipoComprobantePorPago,
} from './comprobantes';

function txMock({
  existing,
  latestCorrelativo = null,
}: {
  existing?: {
    id: string;
    tipo: TipoComprobante;
    serie: string;
    correlativo: number;
    monto: Prisma.Decimal;
    estado: 'pendiente' | 'emitido' | 'anulado';
  } | null;
  latestCorrelativo?: number | null;
}) {
  const comprobantes = {
    findFirst: vi.fn(async (args: { select?: Record<string, unknown>; where?: { tipo?: TipoComprobante } }) => {
      if (args.select?.correlativo && Object.keys(args.select).length === 1) {
        return latestCorrelativo === null ? null : { correlativo: latestCorrelativo };
      }
      return existing ?? null;
    }),
    create: vi.fn(async (args: Prisma.comprobantesCreateArgs) => ({
      id: 'comp-created',
      tipo: args.data.tipo as TipoComprobante,
      serie: args.data.serie as string,
      correlativo: args.data.correlativo as number,
      monto: args.data.monto as Prisma.Decimal,
      estado: args.data.estado,
    })),
  };

  return {
    tx: { comprobantes } as unknown as Prisma.TransactionClient,
    comprobantes,
  };
}

describe('prepararComprobanteDemo', () => {
  it('elige boleta para voucher hotel y usa el monto del pago', async () => {
    const { tx, comprobantes } = txMock({ latestCorrelativo: 41 });

    const result = await prepararComprobanteDemo(tx, {
      tenantId: 'tenant-1',
      reservaId: 'reserva-1',
      tipoPago: TipoPago.voucher_hotel,
      pago: { monto: new Prisma.Decimal('89.50') },
      cotizacionMonto: new Prisma.Decimal('75.00'),
    });

    expect(result.created).toBe(true);
    expect(result.montoFuente).toBe('pago');
    expect(result.comprobante).toMatchObject({
      tipo: TipoComprobante.boleta,
      serie: 'B001',
      correlativo: 42,
      estado: 'pendiente',
    });
    expect(result.comprobante.monto.toFixed(2)).toBe('89.50');
    expect(comprobantes.create).toHaveBeenCalledOnce();
  });

  it('elige factura para factura empresa y usa cotización si no hay pago', async () => {
    const { tx } = txMock({ latestCorrelativo: null });

    const result = await prepararComprobanteDemo(tx, {
      tenantId: 'tenant-1',
      reservaId: 'reserva-1',
      tipoPago: TipoPago.factura_empresa,
      cotizacionMonto: new Prisma.Decimal('126.00'),
    });

    expect(result.montoFuente).toBe('cotizacion');
    expect(result.comprobante.tipo).toBe(TipoComprobante.factura);
    expect(result.comprobante.serie).toBe('F001');
    expect(result.comprobante.correlativo).toBe(1);
    expect(result.comprobante.monto.toFixed(2)).toBe('126.00');
  });

  it('no duplica si ya existe un comprobante del mismo tipo', async () => {
    const existing = {
      id: 'comp-existing',
      tipo: TipoComprobante.boleta,
      serie: 'B001',
      correlativo: 7,
      monto: new Prisma.Decimal('75.00'),
      estado: 'pendiente' as const,
    };
    const { tx, comprobantes } = txMock({ existing, latestCorrelativo: 99 });

    const result = await prepararComprobanteDemo(tx, {
      tenantId: 'tenant-1',
      reservaId: 'reserva-1',
      tipoPago: TipoPago.voucher_hotel,
      pago: { monto: new Prisma.Decimal('88.00') },
    });

    expect(result.created).toBe(false);
    expect(result.montoFuente).toBe('existente');
    expect(result.comprobante.id).toBe('comp-existing');
    expect(comprobantes.create).not.toHaveBeenCalled();
  });

  it('usa fallback legacy explícito sólo si no hay pago ni cotización', async () => {
    const { tx } = txMock({ latestCorrelativo: 0 });

    const result = await prepararComprobanteDemo(tx, {
      tenantId: 'tenant-1',
      reservaId: 'reserva-legacy',
      tipoPago: TipoPago.efectivo,
    });

    expect(result.montoFuente).toBe('legacy_fallback');
    expect(result.comprobante.monto.toFixed(2)).toBe('75.00');
  });
});

describe('serie/tipo de comprobante', () => {
  it('mantiene series estables por tipo', () => {
    expect(serieForTipoComprobante(TipoComprobante.boleta)).toBe('B001');
    expect(serieForTipoComprobante(TipoComprobante.factura)).toBe('F001');
    expect(serieForTipoComprobante(TipoComprobante.ticket)).toBe('T001');
  });

  it('sólo factura empresa elige factura por defecto', () => {
    expect(tipoComprobantePorPago(TipoPago.factura_empresa)).toBe(TipoComprobante.factura);
    expect(tipoComprobantePorPago(TipoPago.voucher_hotel)).toBe(TipoComprobante.boleta);
    expect(tipoComprobantePorPago(TipoPago.app_pago)).toBe(TipoComprobante.boleta);
    expect(tipoComprobantePorPago(TipoPago.efectivo)).toBe(TipoComprobante.boleta);
  });
});
