import {
  sugerirAsignacionDeterminista,
  type SugerenciaAsignacion,
} from '@taxigreen/asignacion';
import { withFallback } from './fallback';
import type { LLMProvider } from './llm-provider';
import { AnthropicProvider } from './providers/anthropic';
import { renderPrompt } from './prompts';

export interface SugerirAsignacionConRazonamientoOptions {
  tenantId?: string;
  provider?: LLMProvider;
  timeoutMs?: number;
  logger?: Parameters<typeof withFallback<SugerenciaAsignacion>>[0]['logger'];
  deterministico?: () => Promise<SugerenciaAsignacion | null>;
}

function normalizeReason(text: string) {
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();
  if (!normalized) return '';

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  return sentences.slice(0, 2).join(' ').trim();
}

function withReason(base: SugerenciaAsignacion, razon: string): SugerenciaAsignacion {
  return {
    ...base,
    razon,
    candidatos: base.candidatos.map((candidate, index) =>
      index === 0 ? { ...candidate, razon } : candidate,
    ),
  };
}

export async function sugerirAsignacionConRazonamiento(
  reservaId: string,
  options: SugerirAsignacionConRazonamientoOptions = {},
): Promise<SugerenciaAsignacion | null> {
  const base =
    (await (options.deterministico?.() ??
      sugerirAsignacionDeterminista(reservaId, { tenantId: options.tenantId }))) ?? null;
  if (!base) return null;

  const provider = options.provider ?? new AnthropicProvider();
  const resultado = await withFallback({
    capacidad: 'racionalizacion',
    timeoutMs: options.timeoutMs ?? 3000,
    logger: options.logger,
    algoritmo: () => base,
    llm: async () => {
      const prompt = renderPrompt('asignacion-racional.v1', {
        candidato: JSON.stringify(
          {
            conductor: base.conductor,
            vehiculo: base.vehiculo,
            score: base.score,
            factores: base.factores,
            razon_determinista: base.razon,
          },
          null,
          2,
        ),
        contexto_reserva: JSON.stringify(base.contexto, null, 2),
      });
      const reason = normalizeReason(
        await provider.generateText({
          prompt,
          maxTokens: 220,
          timeoutMs: options.timeoutMs ?? 3000,
        }),
      );
      return withReason(base, reason || base.razon);
    },
  });

  return {
    ...resultado.resultado,
    fuente: resultado.fuente,
    motivo:
      resultado.fuente === 'llm'
        ? 'racionalizacion_llm'
        : resultado.motivo ?? resultado.resultado.motivo,
    modelo: resultado.fuente === 'llm' ? provider.name : null,
    generadoEn: new Date().toISOString(),
  };
}
