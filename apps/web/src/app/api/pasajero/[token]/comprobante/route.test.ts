import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordAudit, tx } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  tx: {
    reservas: {
      findFirst: vi.fn(),
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

import { EstadoPago, EstadoReserva, EstadoViaje, Prisma, TipoComprobante, TipoPago } from '@taxigreen/database';
import { POST } from './route';

const reservaBase = {
  id: 'reserva-1',
  tenant_id: 'tenant-1',
  voucher_codigo: 'TG-WA-20260611-ABCDE',
  pasajero_nombre: 'Valeria Mendoza',
  tipo_pago: TipoPago.app_pago,
  responsable_pago: 'pasajero',
  estado: EstadoReserva.en_curso,
  cotizacion_monto: new Prisma.Decimal('91.00'),
  pago: {
    monto: new Prisma.Decimal('91.00'),
    estado: EstadoPago.capturado,
  },
  viajes: [{ estado: EstadoViaje.a_bordo }],
};

function request(body: unknown) {
  return POST(
    new Request('http://localhost/api/pasajero/token-1/comprobante', {
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
  tx.reservas.update.mockResolvedValue({});
  tx.comprobantes.findFirst.mockImplementation(async (args: Prisma.comprobantesFindFirstArgs) => {
    if (args.select?.correlativo && Object.keys(args.select).length === 1) return { correlativo: 3 };
    return null;
  });
  tx.comprobantes.create.mockImplementation(async (args: Prisma.comprobantesCreateArgs) => ({
    id: 'comp-1',
    tipo: args.data.tipo as TipoComprobante,
    serie: args.data.serie as string,
    correlativo: args.data.correlativo as number,
    monto: args.data.monto as Prisma.Decimal,
    estado: args.data.estado,
  }));
  recordAudit.mockResolvedValue(undefined);
});

describe('POST /api/pasajero/[token]/comprobante', () => {
  it('bloquea comprobantes antes de que termine el viaje', async () => {
    const response = await request({ tipo: TipoComprobante.boleta, dni: '44556677' });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'viaje_no_terminado' });
    expect(tx.reservas.update).not.toHaveBeenCalled();
    expect(tx.comprobantes.create).not.toHaveBeenCalled();
  });

  it('bloquea el comprobante del pasajero mientras su pago siga por cobrar (F6)', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.por_liquidar,
      pago: {
        monto: new Prisma.Decimal('91.00'),
        estado: EstadoPago.por_cobrar,
      },
      viajes: [{ estado: EstadoViaje.finalizado }],
    });

    const response = await request({ tipo: TipoComprobante.boleta });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'pago_pendiente' });
    expect(tx.comprobantes.create).not.toHaveBeenCalled();
  });

  it('prepara comprobante al terminar usando el monto del pago', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.por_liquidar,
      pago: {
        estado: EstadoPago.capturado,
        monto: new Prisma.Decimal('91.00'),
      },
      viajes: [{ estado: EstadoViaje.finalizado }],
    });

    const response = await request({ tipo: TipoComprobante.boleta, dni: '44556677', nombre: 'Valeria Mendoza' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      comprobante: {
        id: 'comp-1',
        tipo: TipoComprobante.boleta,
        serie: 'B001',
        correlativo: 4,
        monto: '91.00',
      },
    });
    const createArgs = tx.comprobantes.create.mock.calls[0]?.[0] as Prisma.comprobantesCreateArgs;
    expect((createArgs.data.monto as Prisma.Decimal).toFixed(2)).toBe('91.00');
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'comprobante_pasajero_preparado',
        payload: expect.objectContaining({
          monto: '91.00',
          fuente_monto: 'pago',
        }),
      }),
    );
  });
});
