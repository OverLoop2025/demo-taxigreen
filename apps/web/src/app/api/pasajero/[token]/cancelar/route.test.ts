import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordAudit, broadcastReservaEstado, broadcastConductorAsignacion, tx, incidenciasCreate } =
  vi.hoisted(() => ({
    recordAudit: vi.fn(),
    broadcastReservaEstado: vi.fn(),
    broadcastConductorAsignacion: vi.fn(),
    incidenciasCreate: vi.fn(),
    tx: {
      reservas: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      viajes: {
        update: vi.fn(),
      },
      pagos: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  }));

vi.mock('@taxigreen/auditoria', () => ({
  recordAudit,
}));

vi.mock('@/lib/supabase/server', () => ({
  broadcastReservaEstado,
  broadcastConductorAsignacion,
}));

vi.mock('@taxigreen/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/database')>();
  return {
    ...actual,
    prisma: {
      reservas: {
        findFirst: tx.reservas.findFirst,
      },
      incidencias: {
        create: incidenciasCreate,
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
  voucher_codigo: 'TG-WA-20260612-CANC1',
  estado: EstadoReserva.asignada,
  conductor_id: 'conductor-1',
  pasajero_nombre: 'Valeria Mendoza',
  viajes: [{ id: 'viaje-1', estado: EstadoViaje.asignado }],
};

const pagoBase = {
  id: 'pago-1',
  reserva_id: 'reserva-1',
  tipo_pago: TipoPago.app_pago,
  estado: EstadoPago.autorizado,
  monto: new Prisma.Decimal('68.00'),
  moneda: 'PEN',
  payload_demo: {},
};

function request(body: unknown = {}) {
  return POST(
    new Request('http://localhost/api/pasajero/token-1/cancelar', {
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
  tx.viajes.update.mockResolvedValue({});
  tx.pagos.findUnique.mockResolvedValue(pagoBase);
  tx.pagos.update.mockImplementation(async (args: Prisma.pagosUpdateArgs) => ({
    ...pagoBase,
    ...args.data,
    monto: pagoBase.monto,
  }));
  incidenciasCreate.mockResolvedValue({ id: 'incidencia-1' });
  recordAudit.mockResolvedValue(undefined);
  broadcastReservaEstado.mockResolvedValue(null);
  broadcastConductorAsignacion.mockResolvedValue(null);
});

describe('POST /api/pasajero/[token]/cancelar', () => {
  it('cancela con aviso cuando hay unidad asignada: reserva, viaje, pago y broadcasts', async () => {
    const response = await request({ motivo: 'Cambio de planes' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      resultado: 'cancelada',
      etapa: 'con_aviso',
    });
    expect(tx.reservas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: EstadoReserva.cancelada,
          cancelada_por: 'pasajero',
          cancelada_motivo: 'Cambio de planes',
        }),
      }),
    );
    expect(tx.viajes.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoViaje.cancelado } }),
    );
    expect(tx.pagos.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: EstadoPago.rechazado }) }),
    );
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'reserva_cancelada_pasajero' }),
    );
    expect(broadcastConductorAsignacion).toHaveBeenCalledWith(
      expect.objectContaining({ conductorId: 'conductor-1' }),
    );
  });

  it('cancela libre cuando no hay conductor ni viaje', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.confirmada,
      conductor_id: null,
      viajes: [],
    });

    const response = await request();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ resultado: 'cancelada', etapa: 'libre' });
    expect(tx.viajes.update).not.toHaveBeenCalled();
    expect(broadcastConductorAsignacion).not.toHaveBeenCalled();
  });

  it('registra solicitud sin cancelar cuando la unidad está en camino', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.en_curso,
      viajes: [{ id: 'viaje-1', estado: EstadoViaje.en_camino }],
    });

    const response = await request({ motivo: 'Mi vuelo se adelantó' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, resultado: 'solicitud_registrada' });
    expect(incidenciasCreate).toHaveBeenCalled();
    expect(tx.reservas.update).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cancelacion_solicitada_pasajero' }),
    );
  });

  it('no permite cancelar con el pasajero a bordo', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.en_curso,
      viajes: [{ id: 'viaje-1', estado: EstadoViaje.a_bordo }],
    });

    const response = await request();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'cancelacion_no_disponible' });
  });

  it('es idempotente si ya estaba cancelada', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      estado: EstadoReserva.cancelada,
    });

    const response = await request();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, resultado: 'ya_cancelada' });
    expect(tx.reservas.update).not.toHaveBeenCalled();
  });
});
