import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPesosAsignacion, puntuarCandidatos } from './heuristica';
import type {
  ConductorCandidatoInput,
  ReservaAsignacionInput,
  VehiculoCandidatoInput,
} from './types';

const now = new Date('2026-06-01T12:00:00-05:00');

const baseReserva: ReservaAsignacionInput = {
  id: 'reserva-1',
  tipoViaje: 'recojo_aeropuerto',
  origenTexto: 'Aeropuerto Jorge Chávez - Llegadas',
  origenLat: -12.0231,
  origenLng: -77.112,
  destinoTexto: 'Av. Pardo 123, Miraflores',
  pasajeros: 1,
};

const sedan: VehiculoCandidatoInput = {
  id: 'vehiculo-sedan',
  placa: 'ABC-123',
  marca: 'Toyota',
  modelo: 'Corolla',
  tipo: 'sedan',
  capacidad: 4,
};

const minivan: VehiculoCandidatoInput = {
  id: 'vehiculo-minivan',
  placa: 'FMR-802',
  marca: 'Toyota',
  modelo: 'Avanza',
  tipo: 'minivan',
  capacidad: 6,
};

function conductor(
  id: string,
  nombre: string,
  colaMinutos: number | null,
  vehiculoId: string | null,
): ConductorCandidatoInput {
  return {
    id,
    nombre,
    rating: 4.9,
    totalViajes: 300,
    vehiculoId,
    tiempoEnColaDesde:
      colaMinutos === null ? null : new Date(now.getTime() - colaMinutos * 60_000),
    distanciaMockKm: 5,
  };
}

describe('puntuarCandidatos', () => {
  it('deja al conductor sin cola por debajo de uno compatible con cola registrada', () => {
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [
        conductor('sin-cola', 'Sin Cola', null, sedan.id),
        conductor('con-cola', 'Con Cola', 35, sedan.id),
      ],
      vehiculos: [sedan],
      now,
    });

    expect(candidatos[0]?.conductor.id).toBe('con-cola');
    expect(candidatos.at(-1)?.factores.minutosEnCola).toBeNull();
  });

  it('puede sugerir una unidad disponible para un conductor sin vehículo vigente', () => {
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [conductor('libre', 'Libre', 40, null)],
      vehiculos: [sedan],
      now,
    });

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0]?.vehiculo.id).toBe(sedan.id);
  });

  it('filtra unidades insuficientes cuando la reserva requiere más pasajeros', () => {
    const candidatos = puntuarCandidatos({
      reserva: { ...baseReserva, pasajeros: 5 },
      conductores: [
        conductor('sedan-driver', 'Sedan Driver', 50, sedan.id),
        conductor('mini-driver', 'Mini Driver', 45, minivan.id),
      ],
      vehiculos: [sedan, minivan],
      now,
    });

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0]?.vehiculo.id).toBe(minivan.id);
  });

  it('resuelve empate de score por orden de cola más antiguo', () => {
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [
        conductor('cola-30', 'Cola 30', 30, sedan.id),
        conductor('cola-45', 'Cola 45', 45, sedan.id),
      ],
      vehiculos: [sedan],
      now,
      pesos: { cola: 0, distancia: 0, match: 1 },
    });

    expect(candidatos[0]?.conductor.id).toBe('cola-45');
    expect(candidatos[0]?.factores.ordenCola).toBe(1);
  });

  it('mantiene la prioridad de cola sin saturar cuando ambas esperas superan 60 min', () => {
    // Regresión: con el tope `min(min/60,1)` ambos saturaban en 1.0 y el match de
    // unidad (factor secundario) recomendaba al #2 en cola. La regla es
    // "cola, no cercanía pura": el que más espera debe liderar el eje cola.
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [
        conductor('mas-espera', 'Mas Espera', 74, minivan.id), // peor match (minivan)
        conductor('menos-espera', 'Menos Espera', 65, sedan.id), // mejor match (sedan)
      ],
      vehiculos: [sedan, minivan],
      now,
    });

    expect(candidatos[0]?.conductor.id).toBe('mas-espera');
    expect(candidatos[0]?.factores.ordenCola).toBe(1);
  });

  it('devuelve lista vacía si no hay vehículos compatibles', () => {
    const candidatos = puntuarCandidatos({
      reserva: { ...baseReserva, pasajeros: 8 },
      conductores: [conductor('driver', 'Driver', 20, sedan.id)],
      vehiculos: [sedan],
      now,
    });

    expect(candidatos).toEqual([]);
  });

  it('prefiere una van sobre una minivan cuando hay más de 4 pasajeros (cola/distancia iguales)', () => {
    const van: VehiculoCandidatoInput = { ...minivan, id: 'vehiculo-van', tipo: 'van', capacidad: 11 };
    const candidatos = puntuarCandidatos({
      reserva: { ...baseReserva, pasajeros: 6 },
      conductores: [
        conductor('van-driver', 'Van Driver', 40, van.id),
        conductor('mini-driver', 'Mini Driver', 40, minivan.id),
      ],
      vehiculos: [van, minivan],
      now,
    });

    expect(candidatos[0]?.vehiculo.tipo).toBe('van');
  });

  it('usa la preferencia de vehículo como señal de match sin tocar la cola', () => {
    const camioneta: VehiculoCandidatoInput = {
      id: 'vehiculo-camioneta',
      placa: 'CGL-572',
      marca: 'Toyota',
      modelo: 'Rav4',
      tipo: 'camioneta',
      capacidad: 4,
    };
    const candidatos = puntuarCandidatos({
      reserva: { ...baseReserva, tipoVehiculoPreferido: 'camioneta' },
      conductores: [
        conductor('sedan-driver', 'Sedan Driver', 40, sedan.id),
        conductor('camioneta-driver', 'Camioneta Driver', 40, camioneta.id),
      ],
      vehiculos: [sedan, camioneta],
      now,
      pesos: { cola: 0, distancia: 0, match: 1 },
    });

    expect(candidatos[0]?.vehiculo.tipo).toBe('camioneta');
    expect(candidatos[0]?.factores.matchScore).toBe(1);
  });

  it('penaliza la distancia: con cola y match iguales gana el más cercano', () => {
    const lejos: ConductorCandidatoInput = { ...conductor('lejos', 'Lejos', 40, sedan.id), distanciaMockKm: 60 };
    const cerca: ConductorCandidatoInput = { ...conductor('cerca', 'Cerca', 40, sedan.id), distanciaMockKm: 5 };
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [lejos, cerca],
      vehiculos: [sedan],
      now,
    });

    expect(candidatos[0]?.conductor.id).toBe('cerca');
  });

  it('produce una distancia mock estable cuando no hay coordenadas ni distancia provista', () => {
    const sinDistancia: ConductorCandidatoInput = {
      id: 'sin-distancia',
      nombre: 'Sin Distancia',
      rating: 4.8,
      totalViajes: 100,
      vehiculoId: sedan.id,
      tiempoEnColaDesde: new Date(now.getTime() - 30 * 60_000),
    };

    const correr = () =>
      puntuarCandidatos({ reserva: baseReserva, conductores: [sinDistancia], vehiculos: [sedan], now });

    expect(correr()[0]?.factores.distanciaKm).toBe(correr()[0]?.factores.distanciaKm);
    expect(correr()[0]?.factores.distanciaKm).toBeGreaterThan(0);
  });
});

describe('getPesosAsignacion — gobernado por entorno', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa los pesos por defecto cola 0.5 / distancia 0.3 / match 0.2', () => {
    expect(getPesosAsignacion()).toEqual({ cola: 0.5, distancia: 0.3, match: 0.2 });
  });

  it('lee los pesos desde variables de entorno ASIGNACION_PESO_*', () => {
    vi.stubEnv('ASIGNACION_PESO_COLA', '0.9');
    vi.stubEnv('ASIGNACION_PESO_DISTANCIA', '0.05');
    vi.stubEnv('ASIGNACION_PESO_MATCH', '0.05');

    expect(getPesosAsignacion()).toEqual({ cola: 0.9, distancia: 0.05, match: 0.05 });
  });

  it('los overrides explícitos ganan sobre el entorno', () => {
    vi.stubEnv('ASIGNACION_PESO_COLA', '0.9');
    expect(getPesosAsignacion({ cola: 0.1 }).cola).toBe(0.1);
  });

  it('cambiar pesos por entorno se propaga a los factores del candidato', () => {
    vi.stubEnv('ASIGNACION_PESO_COLA', '0.9');
    const candidatos = puntuarCandidatos({
      reserva: baseReserva,
      conductores: [conductor('c1', 'C1', 30, sedan.id)],
      vehiculos: [sedan],
      now,
    });
    expect(candidatos[0]?.factores.pesos.cola).toBe(0.9);
  });

  it('ignora valores de entorno no numéricos y vuelve al default', () => {
    vi.stubEnv('ASIGNACION_PESO_COLA', 'abc');
    expect(getPesosAsignacion().cola).toBe(0.5);
  });
});
