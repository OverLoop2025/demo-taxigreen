import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcastReservaEstado, findAsignacionForConductor, recordAudit, tx, verifyConductorToken } =
  vi.hoisted(() => ({
    broadcastReservaEstado: vi.fn(),
    findAsignacionForConductor: vi.fn(),
    recordAudit: vi.fn(),
    tx: {
      reservas: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      viajes: {
        update: vi.fn(),
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
  bearerTokenFromRequest: (request: Request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
  verifyConductorToken,
}));

vi.mock('@/lib/conductor-asignacion-repository', () => ({
  findAsignacionForConductor,
}));

vi.mock('@/lib/supabase/server', () => ({
  broadcastReservaEstado,
}));

import { EstadoAbordaje, EstadoReserva, EstadoViaje, TipoViaje } from '@taxigreen/database';
import { POST } from './route';

const session = {
  userId: 'user-cond-1',
  tenantId: 'tenant-1',
  conductorId: 'cond-1',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raúl Quispe',
  role: 'conductor' as const,
};

const assignedReserva = {
  id: 'reserva-1',
  voucher_codigo: 'TG-2026-0001',
  tipo_viaje: TipoViaje.recojo_aeropuerto,
  estado_abordaje: EstadoAbordaje.pendiente_validacion,
  estado: EstadoReserva.asignada,
  viajes: [{ id: 'viaje-1', estado: EstadoViaje.asignado }],
};

const serializedFixture = {
  id: 'reserva-1',
  voucher_codigo: 'TG-2026-0001',
  tipo_viaje: TipoViaje.recojo_aeropuerto,
  fecha_hora_servicio: new Date('2026-06-05T15:00:00.000Z'),
  estado: EstadoReserva.en_curso,
  pasajero_nombre: 'Valeria Mendoza',
  pasajero_telefono: '+51 999 111 222',
  pasajero_email: null,
  pasajero_dni: null,
  vuelo_codigo: 'LA2456',
  origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
  origen_lat: -12.0231,
  origen_lng: -77.112,
  punto_encuentro: 'Salida 3, columna F2',
  destino_texto: 'Av. Pardo 123, Miraflores',
  destino_lat: -12.1196,
  destino_lng: -77.0365,
  voucher_emitido_en: new Date('2026-06-05T12:00:00.000Z'),
  token_pasajero: 'tg_demo_passenger_001',
  estado_abordaje: EstadoAbordaje.autorizado,
  counter_validado_en: new Date('2026-06-05T14:58:00.000Z'),
  conductor: {
    id: 'cond-1',
    rating: 4.9,
    total_viajes: 320,
    usuario: { nombre: 'Raúl Quispe', telefono: '+51 988 777 666' },
    vehiculo: {
      id: 'veh-1',
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Corolla',
      tipo: 'sedan' as const,
      capacidad: 4,
      color: 'Plata',
      anio: 2022,
    },
  },
  viajes: [
    {
      id: 'viaje-1',
      estado: EstadoViaje.en_camino,
      inicio_en_camino: new Date('2026-06-05T15:05:00.000Z'),
      llegada_punto: null,
      pasajero_a_bordo: null,
      finalizado_en: null,
      updated_at: new Date('2026-06-05T15:05:00.000Z'),
    },
  ],
};

function postEstado(estadoNuevo: EstadoViaje) {
  return POST(
    new Request('http://localhost/api/conductor/asignacion/reserva-1/estado', {
      method: 'POST',
      headers: { authorization: 'Bearer conductor-token' },
      body: JSON.stringify({ estado_nuevo: estadoNuevo }),
    }),
    { params: Promise.resolve({ id: 'reserva-1' }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyConductorToken.mockResolvedValue(session);
  tx.reservas.findFirst.mockResolvedValue(assignedReserva);
  tx.viajes.update.mockResolvedValue({});
  tx.reservas.update.mockResolvedValue({});
  findAsignacionForConductor.mockResolvedValue(serializedFixture);
  broadcastReservaEstado.mockResolvedValue({ ok: true });
});

describe('POST /api/conductor/asignacion/[id]/estado — gate counter', () => {
  it('bloquea en_camino para recojo_aeropuerto pendiente de counter', async () => {
    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'counter_pendiente',
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
    });
    expect(tx.viajes.update).not.toHaveBeenCalled();
    expect(tx.reservas.update).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'driver_inicio_bloqueado_counter',
        payload: expect.objectContaining({
          reserva_id: 'reserva-1',
          estado_abordaje: EstadoAbordaje.pendiente_validacion,
        }),
      }),
    );
  });

  it('permite en_camino para recojo_aeropuerto autorizado por counter', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      estado_abordaje: EstadoAbordaje.autorizado,
    });

    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.asignacion.abordaje.autorizado).toBe(true);
    expect(tx.viajes.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'viaje-1' },
        data: expect.objectContaining({ estado: EstadoViaje.en_camino }),
      }),
    );
    expect(tx.reservas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reserva-1' },
        data: { estado: EstadoReserva.en_curso },
      }),
    );
  });

  it('permite traslado_aeropuerto aunque no requiera counter', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      tipo_viaje: TipoViaje.traslado_aeropuerto,
      estado_abordaje: EstadoAbordaje.no_requerido,
    });
    findAsignacionForConductor.mockResolvedValue({
      ...serializedFixture,
      tipo_viaje: TipoViaje.traslado_aeropuerto,
      estado_abordaje: EstadoAbordaje.no_requerido,
      counter_validado_en: null,
    });

    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.asignacion.abordaje).toEqual({
      requiereCounter: false,
      autorizado: true,
      counterValidadoEn: null,
    });
  });
});
