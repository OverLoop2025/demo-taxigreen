import { describe, expect, it } from 'vitest';
import { EstadoReserva, EstadoViaje } from '@taxigreen/database';
import {
  estadoReservaParaViaje,
  siguienteEstadoViaje,
  timestampFieldForEstado,
  validarTransicionViaje,
} from './conductor-asignacion';

describe('transiciones de viaje conductor', () => {
  it('permite solo el siguiente estado secuencial', () => {
    expect(siguienteEstadoViaje(EstadoViaje.asignado)).toBe(EstadoViaje.en_camino);
    expect(siguienteEstadoViaje(EstadoViaje.en_camino)).toBe(EstadoViaje.en_punto);
    expect(siguienteEstadoViaje(EstadoViaje.en_punto)).toBe(EstadoViaje.a_bordo);
    expect(siguienteEstadoViaje(EstadoViaje.a_bordo)).toBe(EstadoViaje.finalizado);
    expect(siguienteEstadoViaje(EstadoViaje.finalizado)).toBeNull();
  });

  it('rechaza saltos o repeticiones de estado', () => {
    expect(validarTransicionViaje(EstadoViaje.asignado, EstadoViaje.a_bordo)).toEqual({
      ok: false,
      esperado: EstadoViaje.en_camino,
    });
    expect(validarTransicionViaje(EstadoViaje.en_punto, EstadoViaje.en_punto)).toEqual({
      ok: false,
      esperado: EstadoViaje.a_bordo,
    });
    expect(validarTransicionViaje(EstadoViaje.en_punto, EstadoViaje.a_bordo)).toEqual({
      ok: true,
      esperado: EstadoViaje.a_bordo,
    });
  });

  it('mapea estado de viaje a estado de reserva sin cerrar liquidación', () => {
    expect(estadoReservaParaViaje(EstadoViaje.asignado)).toBe(EstadoReserva.asignada);
    expect(estadoReservaParaViaje(EstadoViaje.en_camino)).toBe(EstadoReserva.en_curso);
    expect(estadoReservaParaViaje(EstadoViaje.en_punto)).toBe(EstadoReserva.en_curso);
    expect(estadoReservaParaViaje(EstadoViaje.a_bordo)).toBe(EstadoReserva.en_curso);
    expect(estadoReservaParaViaje(EstadoViaje.finalizado)).toBe(EstadoReserva.por_liquidar);
  });

  it('elige el timestamp operativo correcto para auditoria y DB', () => {
    expect(timestampFieldForEstado(EstadoViaje.en_camino)).toBe('inicio_en_camino');
    expect(timestampFieldForEstado(EstadoViaje.en_punto)).toBe('llegada_punto');
    expect(timestampFieldForEstado(EstadoViaje.a_bordo)).toBe('pasajero_a_bordo');
    expect(timestampFieldForEstado(EstadoViaje.finalizado)).toBe('finalizado_en');
  });
});
