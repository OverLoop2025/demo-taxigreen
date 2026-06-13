import { describe, expect, it } from 'vitest';
import { instruccionDesdeManiobra, proximaManiobra } from './guidance';
import type { DriverRoutePaso } from './use-route';

describe('instruccionDesdeManiobra — coherencia lado/icono', () => {
  it('giro a la derecha dice "derecha" (nunca el lado contrario)', () => {
    expect(instruccionDesdeManiobra('turn', 'right', 'Av. Higos')).toBe('Gira a la derecha hacia Av. Higos');
  });

  it('giro a la izquierda dice "izquierda"', () => {
    expect(instruccionDesdeManiobra('turn', 'left', null)).toBe('Gira a la izquierda');
  });

  it('ligeros y cerrados mantienen el lado', () => {
    expect(instruccionDesdeManiobra('turn', 'slight right', null)).toBe('Gira ligeramente a la derecha');
    expect(instruccionDesdeManiobra('turn', 'sharp left', null)).toBe('Giro cerrado a la izquierda');
  });

  it('giro en U y recto', () => {
    expect(instruccionDesdeManiobra('turn', 'uturn', null)).toBe('Haz un giro en U');
    expect(instruccionDesdeManiobra('continue', 'straight', null)).toBe('Continúa de frente');
    expect(instruccionDesdeManiobra('continue', null, null)).toBe('Continúa de frente');
  });

  it('llegada, salida y rotonda', () => {
    expect(instruccionDesdeManiobra('arrive', null, null)).toBe('Llegas a tu destino');
    expect(instruccionDesdeManiobra('arrive', 'right', null)).toBe('Llegas a tu destino, a tu derecha');
    expect(instruccionDesdeManiobra('depart', null, 'Av. Pardo')).toBe('Inicia la ruta hacia Av. Pardo');
    expect(instruccionDesdeManiobra('roundabout', null, null)).toBe('Entra a la rotonda y toma tu salida');
  });

  it('rampas y bifurcaciones con lado', () => {
    expect(instruccionDesdeManiobra('off ramp', 'right', null)).toBe('Toma la salida a la derecha');
    expect(instruccionDesdeManiobra('fork', 'left', null)).toBe('Mantente a la izquierda');
  });
});

function paso(overrides: Partial<DriverRoutePaso>): DriverRoutePaso {
  return {
    instruccion: 'texto crudo de mapbox',
    distanciaMetros: 100,
    tipo: 'turn',
    modifier: 'right',
    nombre: null,
    location: null,
    ...overrides,
  };
}

describe('proximaManiobra — normaliza el texto desde el modifier', () => {
  it('reemplaza el string crudo de Mapbox por el derivado del modifier (icono coherente)', () => {
    const resultado = proximaManiobra({
      pasos: [paso({ tipo: 'turn', modifier: 'right', instruccion: 'Gire a la izquierda' })],
      geometry: null,
      gps: null,
    });
    // Aunque Mapbox dijera "izquierda", el lado canónico (modifier=right) manda.
    expect(resultado?.paso.instruccion).toBe('Gira a la derecha');
  });

  it('sin pasos devuelve null', () => {
    expect(proximaManiobra({ pasos: [], geometry: null, gps: null })).toBeNull();
  });

  it('elige la maniobra por delante del GPS sobre la polilínea', () => {
    const geometry = {
      type: 'LineString' as const,
      // Línea recta hacia el este; ~111 m entre cada 0.001° de longitud en el ecuador,
      // aquí basta el orden relativo para la proyección.
      coordinates: [
        [-77.0, -12.0],
        [-77.0, -12.001],
        [-77.0, -12.002],
        [-77.0, -12.003],
      ],
    };
    const pasos = [
      paso({ modifier: 'left', location: [-77.0, -12.0005] }), // ya pasado
      paso({ modifier: 'right', location: [-77.0, -12.0025] }), // por delante
    ];
    const resultado = proximaManiobra({ pasos, geometry, gps: { lat: -12.001, lng: -77.0 } });
    expect(resultado?.paso.instruccion).toBe('Gira a la derecha');
  });
});
