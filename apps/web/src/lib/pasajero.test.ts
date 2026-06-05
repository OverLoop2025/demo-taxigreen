import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { RouteResult } from '@taxigreen/rutas';

// Mockeamos `withRutaFallback` para controlar qué devuelve el proveedor de rutas
// SIN red. Por defecto degrada a la estimación determinista real (recta de 2
// puntos); los tests que necesitan una curva real de Mapbox la inyectan con
// `mockResolvedValueOnce`. Así probamos la regla anti-recta del SERVIDOR: el link
// /p/[token] nunca debe entregar una geometría falsa (recta) como si fuera ruta
// real por calles. Ver [[mapas-solo-ruta-real]].
vi.mock('@taxigreen/rutas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/rutas')>();
  return {
    ...actual,
    withRutaFallback: vi.fn(async ({ request }: { request: Parameters<typeof actual.calcularRutaEstimada>[0] }) =>
      actual.calcularRutaEstimada(request),
    ),
  };
});

import { withRutaFallback } from '@taxigreen/rutas';
import { serializePassengerTrip } from './pasajero';

type PassengerRecord = Parameters<typeof serializePassengerTrip>[0];

const ORIGEN: [number, number] = [-77.112, -12.0231];

function makeReserva(overrides: Partial<PassengerRecord> = {}): PassengerRecord {
  const base = {
    id: 'reserva-1',
    tenant_id: 'tenant-1',
    voucher_codigo: 'TG-2026-0001',
    token_pasajero: 'tg_demo_passenger_001',
    estado: 'en_curso',
    tipo_viaje: 'recojo_aeropuerto',
    pasajero_nombre: 'Valeria Mendoza',
    pasajero_telefono: '+51 999 111 222',
    pasajero_email: null,
    pasajero_dni: null,
    pasajero_ruc: null,
    solicitante_nombre: 'Hotel Costa',
    solicitante_contacto: 'concierge',
    hotel_nombre: 'Hotel Costa',
    empresa_nombre: null,
    origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
    origen_lat: ORIGEN[1],
    origen_lng: ORIGEN[0],
    destino_texto: 'Av. Pardo 123, Miraflores',
    destino_lat: -12.1196,
    destino_lng: -77.0365,
    punto_encuentro: 'Salida 3, columna F2',
    vuelo_codigo: 'LA2456',
    fecha_hora_servicio: new Date('2026-06-05T15:00:00.000Z'),
    calificacion: null,
    conductor: null,
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
    comprobantes: [],
    incidencias: [],
  };

  return { ...base, ...overrides } as PassengerRecord;
}

function mapboxRoute(puntos: number): RouteResult {
  const coordinates: Array<[number, number]> = Array.from({ length: puntos }, (_, i) => [
    ORIGEN[0] - i * 0.0002,
    ORIGEN[1] - i * 0.0002,
  ]);
  return {
    distanciaMetros: 15_000,
    duracionSegundos: 1_320,
    duracionSinTraficoSegundos: 1_200,
    geometry: { type: 'LineString', coordinates },
    fuente: 'mapbox',
    calculadoEn: '2026-06-05T15:06:00.000Z',
  };
}

beforeEach(() => {
  // mockClear conserva la implementación por defecto (estimación) y sólo limpia
  // el registro de llamadas; mockReset la borraría.
  vi.mocked(withRutaFallback).mockClear();
});

describe('serializePassengerTrip — tracking sin geometría falsa', () => {
  it('con estimación determinista NO entrega geometría (recta), pero sí ETA y distancia', async () => {
    const trip = await serializePassengerTrip(makeReserva({ destino_lng: -77.0365 }));

    expect(trip.tracking.fuente).toBe('estimacion');
    expect(trip.tracking.geometry).toBeNull();
    expect(trip.tracking.distanciaMetros).toBeGreaterThan(0);
    expect(trip.tracking.etaMinutos).toBeGreaterThan(0);
  });

  it('con curva real de Mapbox (100 vértices) SÍ entrega la geometría', async () => {
    vi.mocked(withRutaFallback).mockResolvedValueOnce(mapboxRoute(100));
    const trip = await serializePassengerTrip(makeReserva({ destino_lng: -77.0366 }));

    expect(trip.tracking.fuente).toBe('mapbox');
    expect(trip.tracking.geometry).not.toBeNull();
    expect(trip.tracking.geometry?.coordinates).toHaveLength(100);
    expect(trip.tracking.distanciaMetros).toBe(15_000);
  });

  it('si Mapbox devolviera una geometría degenerada de 2 puntos, NO la pinta', async () => {
    vi.mocked(withRutaFallback).mockResolvedValueOnce(mapboxRoute(2));
    const trip = await serializePassengerTrip(makeReserva({ destino_lng: -77.0367 }));

    // El guard exige >2 vértices: una recta nunca se entrega como trazo real,
    // aunque la fuente sea mapbox. Las métricas (ETA/distancia) sí pasan.
    expect(trip.tracking.geometry).toBeNull();
    expect(trip.tracking.distanciaMetros).toBe(15_000);
  });

  it('sin coordenadas usables NO calcula ruta ni inventa geometría (fallback textual)', async () => {
    const trip = await serializePassengerTrip(
      makeReserva({ origen_lat: null, origen_lng: null, destino_lat: null, destino_lng: null }),
    );

    expect(withRutaFallback).not.toHaveBeenCalled();
    expect(trip.tracking.geometry).toBeNull();
    expect(trip.tracking.fuente).toBe('estimacion');
    expect(trip.tracking.distanciaMetros).toBeNull();
    // ETA cae al estimador por fase (en_camino → 7 min), nunca rompe la UI.
    expect(trip.tracking.etaMinutos).toBe(7);
  });

  it('el comprobante sólo está disponible cuando el viaje terminó', async () => {
    const enCurso = await serializePassengerTrip(makeReserva({ destino_lng: -77.0368 }));
    expect(enCurso.comprobante.disponible).toBe(false);

    const finalizado = await serializePassengerTrip(
      makeReserva({
        destino_lng: -77.0369,
        estado: 'por_liquidar',
        viajes: [
          {
            id: 'viaje-1',
            estado: 'finalizado',
            inicio_en_camino: new Date('2026-06-05T15:05:00.000Z'),
            llegada_punto: new Date('2026-06-05T15:12:00.000Z'),
            pasajero_a_bordo: new Date('2026-06-05T15:15:00.000Z'),
            finalizado_en: new Date('2026-06-05T15:40:00.000Z'),
            updated_at: new Date('2026-06-05T15:40:00.000Z'),
          },
        ],
      } as Partial<PassengerRecord>),
    );
    expect(finalizado.comprobante.disponible).toBe(true);
  });
});
