import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordAudit, tx } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  tx: {
    reservas: {
      findFirst: vi.fn(),
    },
    pagos: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    comprobantes: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@taxigreen/auditoria', () => ({
  recordAudit,
}));

vi.mock('@taxigreen/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/database')>();
  return {
    ...actual,
    prisma: {
      reservas: {
        findFirst: tx.reservas.findFirst,
      },
      $transaction: vi.fn((callback) => callback(tx)),
    },
  };
});

import { EstadoPago, EstadoReserva, EstadoViaje, Prisma, TipoPago } from '@taxigreen/database';
import { POST } from './route';

const reservaBase = {
  id: 'reserva-1',
  tenant_id: 'tenant-1',
  voucher_codigo: 'TG-WA-20260612-PAGO1',
  estado: EstadoReserva.por_liquidar,
  tipo_pago: TipoPago.app_pago,
  responsable_pago: 'pasajero',
  requiere_factura: false,
  pasajero_ruc: null,
  cotizacion_monto: new Prisma.Decimal('68.00'),
  pago: { id: 'pago-1', estado: EstadoPago.por_cobrar, tipo_pago: TipoPago.app_pago },
  viajes: [{ estado: EstadoViaje.finalizado }],
};

const pagoBase = {
  id: 'pago-1',
  reserva_id: 'reserva-1',
  tipo_pago: TipoPago.app_pago,
  estado: EstadoPago.por_cobrar,
  monto: new Prisma.Decimal('68.00'),
  moneda: 'PEN',
  autorizacion: 'AUT-AAAAAA',
  capturado_en: null,
  payload_demo: {},
};

function request(body: unknown) {
  return POST(
    new Request('http://localhost/api/pasajero/token-1/pago', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token: 'token-1' }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  tx.reservas.findFirst.mockResolvedValue(reservaBase);
  tx.pagos.findUnique.mockResolvedValue(pagoBase);
  tx.pagos.update.mockImplementation(async (args: Prisma.pagosUpdateArgs) => ({
    ...pagoBase,
    ...args.data,
    monto: pagoBase.monto,
    capturado_en: new Date('2026-06-12T10:00:00Z'),
  }));
  tx.comprobantes.findFirst.mockResolvedValue(null);
  tx.comprobantes.create.mockImplementation(async (args: Prisma.comprobantesCreateArgs) => ({
    id: 'comp-1',
    tipo: args.data.tipo,
    serie: args.data.serie as string,
    correlativo: 1,
    monto: args.data.monto as Prisma.Decimal,
    estado: args.data.estado,
  }));
  recordAudit.mockResolvedValue(undefined);
});

describe('POST /api/pasajero/[token]/pago', () => {
  it('captura el pago por_cobrar, audita y prepara el comprobante', async () => {
    const response = await request({ accion: 'pagar_app' });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      yaPagado: false,
      pago: { estado: EstadoPago.capturado, monto: '68.00' },
      comprobante: { serie: 'B001' },
    });
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'pago_pasajero_capturado_demo' }),
    );
  });

  it('rechaza con 409 cuando el convenio cubre el servicio', async () => {
    tx.reservas.findFirst.mockResolvedValue({ ...reservaBase, responsable_pago: 'hotel' });

    const response = await request({ accion: 'pagar_app' });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'pago_cubierto_por_convenio' });
    expect(tx.pagos.update).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si el viaje no terminó', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.en_curso,
      viajes: [{ estado: EstadoViaje.a_bordo }],
    });

    const response = await request({ accion: 'pagar_app' });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'viaje_no_terminado' });
  });

  it('permite pagar con una marca digital aunque el método inicial fuera efectivo', async () => {
    // El pasajero decide al final cómo paga: una reserva nacida en efectivo puede
    // pagarse digitalmente y el método pasa a app_pago en la captura.
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      pago: { ...reservaBase.pago, tipo_pago: TipoPago.efectivo },
    });
    tx.pagos.findUnique.mockResolvedValue({ ...pagoBase, tipo_pago: TipoPago.efectivo });

    const response = await request({ accion: 'pagar_app', metodo: 'yape' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      pago: { estado: EstadoPago.capturado },
    });
    expect(tx.pagos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo_pago: TipoPago.app_pago }),
      }),
    );
  });

  it('es idempotente cuando el pago ya estaba capturado', async () => {
    tx.pagos.findUnique.mockResolvedValue({
      ...pagoBase,
      estado: EstadoPago.capturado,
      capturado_en: new Date('2026-06-12T09:00:00Z'),
    });

    const response = await request({ accion: 'pagar_app' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, yaPagado: true });
    expect(tx.pagos.update).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('emite factura cuando el pasajero dejó RUC', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      requiere_factura: true,
      pasajero_ruc: '20100100100',
    });

    const response = await request({ accion: 'pagar_app' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      comprobante: { serie: 'F001' },
    });
  });
});
