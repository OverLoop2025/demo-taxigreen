import { describe, expect, it } from 'vitest';
import { EstadoAbordaje, EstadoReserva, EstadoViaje, TipoViaje } from '@taxigreen/database';
import {
  estadoAbordajeInicial,
  estadoReservaParaViaje,
  puedeIniciarRuta,
  requiereCounter,
  serializeConductorAsignacion,
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

describe('gate de counter para recojo aeropuerto', () => {
  it('marca counter requerido solo para recojo de aeropuerto', () => {
    expect(requiereCounter(TipoViaje.recojo_aeropuerto)).toBe(true);
    expect(requiereCounter(TipoViaje.traslado_aeropuerto)).toBe(false);
    expect(requiereCounter(TipoViaje.city)).toBe(false);
  });

  it('elige estado inicial de abordaje por tipo de viaje', () => {
    expect(estadoAbordajeInicial(TipoViaje.recojo_aeropuerto)).toBe(EstadoAbordaje.pendiente_validacion);
    expect(estadoAbordajeInicial(TipoViaje.traslado_aeropuerto)).toBe(EstadoAbordaje.no_requerido);
    expect(estadoAbordajeInicial(TipoViaje.city)).toBe(EstadoAbordaje.no_requerido);
  });

  it('bloquea recojo aeropuerto si falta validación de counter', () => {
    expect(
      puedeIniciarRuta({
        tipoViaje: TipoViaje.recojo_aeropuerto,
        estadoAbordaje: EstadoAbordaje.pendiente_validacion,
      }),
    ).toEqual({ ok: false, motivo: 'counter_pendiente' });
  });

  it('permite recojo aeropuerto cuando counter autorizó', () => {
    expect(
      puedeIniciarRuta({
        tipoViaje: TipoViaje.recojo_aeropuerto,
        estadoAbordaje: EstadoAbordaje.autorizado,
      }),
    ).toEqual({ ok: true });
  });

  it('no bloquea traslado aeropuerto ni city', () => {
    expect(
      puedeIniciarRuta({
        tipoViaje: TipoViaje.traslado_aeropuerto,
        estadoAbordaje: EstadoAbordaje.no_requerido,
      }),
    ).toEqual({ ok: true });
    expect(
      puedeIniciarRuta({
        tipoViaje: TipoViaje.city,
        estadoAbordaje: EstadoAbordaje.no_requerido,
      }),
    ).toEqual({ ok: true });
  });
});

describe('serializeConductorAsignacion — abordaje', () => {
  const baseReserva = {
    id: 'reserva-1',
    voucher_codigo: 'TG-2026-0001',
    tipo_viaje: TipoViaje.recojo_aeropuerto,
    fecha_hora_servicio: new Date('2026-06-05T15:00:00.000Z'),
    estado: EstadoReserva.asignada,
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
    estado_abordaje: EstadoAbordaje.pendiente_validacion,
    counter_validado_en: null,
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
        estado: EstadoViaje.asignado,
        inicio_en_camino: null,
        llegada_punto: null,
        pasajero_a_bordo: null,
        finalizado_en: null,
        updated_at: new Date('2026-06-05T15:05:00.000Z'),
      },
    ],
  } satisfies Parameters<typeof serializeConductorAsignacion>[0];

  it('serializa recojo pendiente como bloqueo visible para la app', () => {
    const asignacion = serializeConductorAsignacion(baseReserva);
    expect(asignacion.abordaje).toEqual({
      requiereCounter: true,
      autorizado: false,
      counterValidadoEn: null,
    });
  });

  it('serializa recojo autorizado con timestamp de counter', () => {
    const counterValidadoEn = new Date('2026-06-05T15:10:00.000Z');
    const asignacion = serializeConductorAsignacion({
      ...baseReserva,
      estado_abordaje: EstadoAbordaje.autorizado,
      counter_validado_en: counterValidadoEn,
    });
    expect(asignacion.abordaje).toEqual({
      requiereCounter: true,
      autorizado: true,
      counterValidadoEn: counterValidadoEn.toISOString(),
    });
  });
});

describe('máquina de estados del viaje — blindaje de bordes', () => {
  it('recorre la secuencia completa hacia adelante sin rechazos', () => {
    const secuencia = [
      EstadoViaje.asignado,
      EstadoViaje.en_camino,
      EstadoViaje.en_punto,
      EstadoViaje.a_bordo,
      EstadoViaje.finalizado,
    ];
    for (let i = 0; i < secuencia.length - 1; i += 1) {
      expect(validarTransicionViaje(secuencia[i]!, secuencia[i + 1]!).ok).toBe(true);
    }
  });

  it('rechaza retroceder (finalizado → en_camino, a_bordo → en_camino)', () => {
    expect(validarTransicionViaje(EstadoViaje.finalizado, EstadoViaje.en_camino).ok).toBe(false);
    expect(validarTransicionViaje(EstadoViaje.a_bordo, EstadoViaje.en_camino).ok).toBe(false);
    expect(validarTransicionViaje(EstadoViaje.en_camino, EstadoViaje.asignado).ok).toBe(false);
  });

  it('no hay siguiente estado después de finalizado (estado terminal)', () => {
    expect(siguienteEstadoViaje(EstadoViaje.finalizado)).toBeNull();
    expect(validarTransicionViaje(EstadoViaje.finalizado, EstadoViaje.finalizado)).toEqual({
      ok: false,
      esperado: null,
    });
  });

  it('cancelado queda fuera de la secuencia: no avanza a ningún estado', () => {
    expect(siguienteEstadoViaje(EstadoViaje.cancelado)).toBeNull();
    expect(validarTransicionViaje(EstadoViaje.cancelado, EstadoViaje.en_camino).ok).toBe(false);
    expect(validarTransicionViaje(EstadoViaje.asignado, EstadoViaje.cancelado).ok).toBe(false);
  });

  it('no permite saltarse un estado intermedio (en_camino → a_bordo)', () => {
    expect(validarTransicionViaje(EstadoViaje.en_camino, EstadoViaje.a_bordo)).toEqual({
      ok: false,
      esperado: EstadoViaje.en_punto,
    });
  });
});
