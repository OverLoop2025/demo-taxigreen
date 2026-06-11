import { describe, expect, it, beforeEach, vi } from 'vitest';

// Mockeamos el acceso a DB (repositorio) y usamos tokens Bearer REALES para
// ejercitar el guard de autenticación tal cual corre en producción. Este endpoint
// permite que la app conductor muestre el viaje al abrir, sin depender del push ni
// del broadcast Realtime; por eso su contrato (401 sin sesión, asignación o null)
// es crítico para móvil + seguridad + estado operativo.
const { findActive } = vi.hoisted(() => ({ findActive: vi.fn() }));
vi.mock('@/lib/conductor-asignacion-repository', () => ({
  findActiveAsignacionForConductor: findActive,
}));

import { serializeConductorAsignacion } from '@/lib/conductor-asignacion';
import { createConductorToken } from '@/lib/conductor-token';
import { EstadoAbordaje, TipoViaje } from '@taxigreen/database';
import { GET } from './route';

const session = {
  userId: 'user-cond-1',
  tenantId: 'tenant-1',
  conductorId: 'cond-1',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raúl Quispe',
  role: 'conductor' as const,
};

const reservaFixture = {
  id: 'reserva-1',
  voucher_codigo: 'TG-2026-0001',
  tipo_viaje: TipoViaje.recojo_aeropuerto,
  fecha_hora_servicio: new Date('2026-06-05T15:00:00.000Z'),
  estado: 'asignada',
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
      estado: 'en_camino',
      inicio_en_camino: new Date('2026-06-05T15:05:00.000Z'),
      llegada_punto: null,
      pasajero_a_bordo: null,
      finalizado_en: null,
      updated_at: new Date('2026-06-05T15:05:00.000Z'),
    },
  ],
} satisfies Parameters<typeof serializeConductorAsignacion>[0];

async function getWith(headers?: HeadersInit) {
  return GET(new Request('http://localhost/api/conductor/asignacion/activa', { headers }));
}

beforeEach(() => {
  findActive.mockReset();
});

describe('GET /api/conductor/asignacion/activa', () => {
  it('401 sin header Authorization', async () => {
    const res = await getWith();
    expect(res.status).toBe(401);
    expect(findActive).not.toHaveBeenCalled();
  });

  it('401 con token Bearer inválido', async () => {
    const res = await getWith({ authorization: 'Bearer no-es-un-jwt' });
    expect(res.status).toBe(401);
    expect(findActive).not.toHaveBeenCalled();
  });

  it('devuelve la asignación serializada para un conductor con viaje activo', async () => {
    findActive.mockResolvedValue(reservaFixture);
    const token = await createConductorToken(session);

    const res = await getWith({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.asignacion).not.toBeNull();
    expect(body.asignacion.id).toBe('reserva-1');
    expect(body.asignacion.voucherCodigo).toBe('TG-2026-0001');
    expect(body.asignacion.pasajero.nombre).toBe('Valeria Mendoza');
    expect(body.asignacion.viaje.estado).toBe('en_camino');
    expect(body.asignacion.unidad.placa).toBe('ABC-123');
    expect(body.asignacion.abordaje).toEqual({
      requiereCounter: true,
      autorizado: true,
      counterValidadoEn: '2026-06-05T14:58:00.000Z',
    });

    // El repositorio recibe la sesión verificada del token, no datos del request.
    expect(findActive).toHaveBeenCalledWith(expect.objectContaining({ conductorId: 'cond-1' }));
  });

  it('devuelve { asignacion: null } cuando el conductor no tiene asignación vigente', async () => {
    findActive.mockResolvedValue(null);
    const token = await createConductorToken(session);

    const res = await getWith({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ asignacion: null });
  });

  it('no filtra el payload firmado del voucher en la respuesta', async () => {
    findActive.mockResolvedValue(reservaFixture);
    const token = await createConductorToken(session);

    const res = await getWith({ authorization: `Bearer ${token}` });
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain('password_hash');
    expect(raw).not.toContain('voucher_qr_payload');
  });
});
