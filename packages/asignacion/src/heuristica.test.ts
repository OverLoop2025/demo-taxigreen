import { describe, expect, it } from 'vitest';
import { puntuarCandidatos } from './heuristica';
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
});
