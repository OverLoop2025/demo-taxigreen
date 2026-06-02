import { afterEach, describe, expect, it } from 'vitest';
import { extraerReservaDeterminista, type ExtraccionReservaResultado } from '@taxigreen/ingesta';
import { extraerReservaConFallback } from './extractor-llm';
import type { GenerateObjectArgs, GenerateTextArgs, LLMProvider } from './llm-provider';

const INPUT = {
  fechaActualIso: '2026-05-31T12:00:00-05:00',
  mensaje:
    'Hotel solicita recojo en Jorge Chávez para huésped Valeria Mendoza mañana 03:45 vuelo LA2456. Destino Av. Pardo 123, Miraflores. Salida 3 columna F2. Tel huésped 988777666. Voucher hotel.',
};

class FakeProvider implements LLMProvider {
  readonly name = 'fake-llm';

  constructor(private readonly mode: 'ok' | 'fail') {}

  async generateObject<T>(_args: GenerateObjectArgs<T>): Promise<T> {
    if (this.mode === 'fail') throw new Error('boom');
    const base = extraerReservaDeterminista(INPUT);
    return {
      ...base,
      fuente: 'llm',
      motivo: 'LLM estructuró el mensaje.',
      modelo: this.name,
    } satisfies ExtraccionReservaResultado as T;
  }

  async generateText(_args: GenerateTextArgs): Promise<string> {
    return 'ok';
  }
}

describe('extraerReservaConFallback', () => {
  const previous = process.env.IA_HABILITADA;

  afterEach(() => {
    process.env.IA_HABILITADA = previous;
  });

  it('usa algoritmo cuando IA_HABILITADA=false', async () => {
    process.env.IA_HABILITADA = 'false';
    const result = await extraerReservaConFallback(INPUT, { provider: new FakeProvider('fail') });
    expect(result.fuente).toBe('algoritmo');
    expect(result.motivo).toContain('IA_HABILITADA=false');
  });

  it('usa LLM cuando está habilitado y responde estructurado', async () => {
    process.env.IA_HABILITADA = 'true';
    const result = await extraerReservaConFallback(INPUT, { provider: new FakeProvider('ok') });
    expect(result.fuente).toBe('llm');
    expect(result.reserva.origen_texto).toBe('Aeropuerto Jorge Chávez - Llegadas');
  });

  it('vuelve al algoritmo si el LLM falla', async () => {
    process.env.IA_HABILITADA = 'true';
    const result = await extraerReservaConFallback(INPUT, { provider: new FakeProvider('fail') });
    expect(result.fuente).toBe('algoritmo');
    expect(result.motivo).toContain('Fallback');
  });
});
