import { afterEach, describe, expect, it } from 'vitest';
import type { SugerenciaAsignacion } from '@taxigreen/asignacion';
import { sugerirAsignacionConRazonamiento } from './racionalizador-llm';
import type { GenerateObjectArgs, GenerateTextArgs, LLMProvider } from './llm-provider';

const base: SugerenciaAsignacion = {
  reservaId: 'reserva-1',
  tenantId: 'tenant-1',
  contexto: {
    voucherCodigo: 'TG-WA-TEST',
    tipoViaje: 'recojo_aeropuerto',
    origenTexto: 'Aeropuerto Jorge Chávez - Llegadas',
    destinoTexto: 'Av. Pardo 123, Miraflores',
  },
  conductor: {
    id: 'conductor-1',
    nombre: 'Raúl Quispe',
    rating: 4.9,
    totalViajes: 487,
    tiempoEnColaDesde: '2026-06-01T16:00:00.000Z',
    fotoUrl: null,
  },
  vehiculo: {
    id: 'vehiculo-1',
    placa: 'ABC-123',
    marca: 'Toyota',
    modelo: 'Corolla Hybrid',
    tipo: 'sedan',
    capacidad: 4,
    color: 'Blanco',
    anio: 2023,
  },
  razon: 'Sugerido por: 1° en cola, unidad sedan compatible y 5.0 km al punto.',
  score: 88,
  factores: {
    ordenCola: 1,
    minutosEnCola: 42,
    colaScore: 0.7,
    distanciaKm: 5,
    distanciaScore: 0.2,
    matchScore: 1,
    pasajerosRequeridos: 1,
    capacidadUnidad: 4,
    capacidadSuficiente: true,
    pesos: { cola: 0.5, distancia: 0.3, match: 0.2 },
  },
  fuente: 'algoritmo',
  motivo: 'heuristica_determinista',
  modelo: null,
  candidatos: [],
  generadoEn: '2026-06-01T17:00:00.000Z',
};

class FakeProvider implements LLMProvider {
  readonly name = 'fake-haiku';

  constructor(private readonly mode: 'ok' | 'fail' | 'slow') {}

  async generateObject<T>(_args: GenerateObjectArgs<T>): Promise<T> {
    throw new Error('not used');
  }

  async generateText(_args: GenerateTextArgs): Promise<string> {
    if (this.mode === 'fail') throw new Error('boom');
    if (this.mode === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    return 'Raúl está primero en la cola y la unidad cubre bien este recojo del aeropuerto. La distancia es razonable para despachar sin romper el orden operativo.';
  }
}

describe('sugerirAsignacionConRazonamiento', () => {
  const previous = process.env.IA_HABILITADA;

  afterEach(() => {
    process.env.IA_HABILITADA = previous;
  });

  it('usa razón determinista cuando IA_HABILITADA=false', async () => {
    process.env.IA_HABILITADA = 'false';
    const result = await sugerirAsignacionConRazonamiento('reserva-1', {
      provider: new FakeProvider('fail'),
      deterministico: async () => base,
    });

    expect(result?.fuente).toBe('algoritmo');
    expect(result?.razon).toBe(base.razon);
    expect(result?.conductor.id).toBe(base.conductor.id);
    expect(result?.vehiculo.id).toBe(base.vehiculo.id);
  });

  it('usa LLM para redactar sin cambiar conductor ni unidad', async () => {
    process.env.IA_HABILITADA = 'true';
    const result = await sugerirAsignacionConRazonamiento('reserva-1', {
      provider: new FakeProvider('ok'),
      deterministico: async () => base,
    });

    expect(result?.fuente).toBe('llm');
    expect(result?.modelo).toBe('fake-haiku');
    expect(result?.razon).toContain('Raúl está primero');
    expect(result?.conductor.id).toBe(base.conductor.id);
    expect(result?.vehiculo.id).toBe(base.vehiculo.id);
  });

  it('vuelve a razón determinista si el LLM falla', async () => {
    process.env.IA_HABILITADA = 'true';
    const result = await sugerirAsignacionConRazonamiento('reserva-1', {
      provider: new FakeProvider('fail'),
      deterministico: async () => base,
    });

    expect(result?.fuente).toBe('algoritmo');
    expect(result?.motivo).toBe('fallback');
    expect(result?.razon).toBe(base.razon);
  });

  it('vuelve a razón determinista si el LLM excede timeout', async () => {
    process.env.IA_HABILITADA = 'true';
    const result = await sugerirAsignacionConRazonamiento('reserva-1', {
      provider: new FakeProvider('slow'),
      timeoutMs: 1,
      deterministico: async () => base,
    });

    expect(result?.fuente).toBe('algoritmo');
    expect(result?.motivo).toBe('fallback');
    expect(result?.razon).toBe(base.razon);
  });
});
