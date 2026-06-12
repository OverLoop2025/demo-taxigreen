import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcastReservaEstado, broadcastConductorAsignacion, recordAudit, tx, verifyConductorToken } =
  vi.hoisted(() => ({
    broadcastReservaEstado: vi.fn(),
    broadcastConductorAsignacion: vi.fn(),
    recordAudit: vi.fn(),
    tx: {
      reservas: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      viajes: {
        update: vi.fn(),
      },
      auditoria: {
        create: vi.fn(),
      },
    },
    verifyConductorToken: vi.fn(),
  }));

vi.mock('@taxigreen/auditoria', () => ({
  recordAudit,
}));

vi.mock('@taxigreen/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/database')>();
  return {
    ...actual,
    prisma: {
      $transaction: vi.fn((callback) => callback(tx)),
    },
  };
});

vi.mock('@/lib/conductor-token', () => ({
  bearerTokenFromRequest: (request: Request) =>
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
  verifyConductorToken,
}));

vi.mock('@/lib/supabase/server', () => ({
  broadcastReservaEstado,
  broadcastConductorAsignacion,
}));

import { EstadoAbordaje, EstadoReserva, EstadoViaje } from '@taxigreen/database';
import { POST } from './route';

const session = {
  userId: 'user-cond-1',
  tenantId: 'tenant-1',
  conductorId: 'cond-1',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raúl Quispe',
  role: 'conductor' as const,
};

const reservaBase = {
  id: 'reserva-1',
  voucher_codigo: 'TG-WA-20260612-DRV01',
  estado_abordaje: EstadoAbordaje.autorizado,
  viajes: [{ id: 'viaje-1', estado: EstadoViaje.en_camino }],
};

function postCancelar(body: unknown) {
  return POST(
    new Request('http://localhost/api/conductor/asignacion/reserva-1/cancelar', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token-1' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: 'reserva-1' }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyConductorToken.mockResolvedValue(session);
  tx.reservas.findFirst.mockResolvedValue(reservaBase);
  tx.reservas.update.mockResolvedValue({});
  tx.viajes.update.mockResolvedValue({});
  tx.auditoria.create.mockResolvedValue({});
  recordAudit.mockResolvedValue(undefined);
  broadcastReservaEstado.mockResolvedValue(null);
  broadcastConductorAsignacion.mockResolvedValue(null);
});

describe('POST /api/conductor/asignacion/[id]/cancelar', () => {
  it('cancela el viaje, libera la reserva y conserva el estado de abordaje', async () => {
    const response = await postCancelar({ motivo: 'problema_mecanico', comentario: 'Llanta baja' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, resultado: 'cancelado' });
    expect(tx.viajes.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoViaje.cancelado } }),
    );
    expect(tx.reservas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { estado: EstadoReserva.confirmada, conductor_id: null },
      }),
    );
    expect(tx.auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'viaje_cancelado_por_conductor',
          payload: expect.objectContaining({
            motivo: 'problema_mecanico',
            comentario: 'Llanta baja',
            estado_abordaje_conservado: EstadoAbordaje.autorizado,
          }),
        }),
      }),
    );
    expect(broadcastConductorAsignacion).toHaveBeenCalled();
    expect(broadcastReservaEstado).toHaveBeenCalledWith(
      expect.objectContaining({ estadoViaje: EstadoViaje.cancelado }),
    );
  });

  it('exige motivo del catálogo', async () => {
    const response = await postCancelar({ motivo: 'me_aburri' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'motivo_requerido' });
  });

  it('no permite cancelar con el pasajero a bordo', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...reservaBase,
      viajes: [{ id: 'viaje-1', estado: EstadoViaje.a_bordo }],
    });

    const response = await postCancelar({ motivo: 'emergencia_personal' });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: 'viaje_no_cancelable' });
    expect(tx.viajes.update).not.toHaveBeenCalled();
    expect(tx.reservas.update).not.toHaveBeenCalled();
  });

  it('404 cuando la reserva no pertenece al conductor', async () => {
    tx.reservas.findFirst.mockResolvedValue(null);

    const response = await postCancelar({ motivo: 'otro' });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'asignacion_no_encontrada' });
  });
});
