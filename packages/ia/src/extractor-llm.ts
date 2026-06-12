import {
  extraerReservaDeterminista,
  extraccionReservaResultadoSchema,
  type ExtractorInput,
  type ExtraccionReservaResultado,
  type ReservaExtraida,
} from '@taxigreen/ingesta';
import { withFallback } from './fallback';
import type { LLMProvider } from './llm-provider';
import { AnthropicProvider } from './providers/anthropic';
import { renderPrompt } from './prompts';
import { llmExtraccionSchema, type LlmExtraccion } from './schemas';

const CAMPOS_DETERMINISTICOS_PRIORITARIOS: Array<keyof ReservaExtraida> = [
  'tipo_viaje',
  'solicitante_tipo',
  'origen_texto',
  'origen_lat',
  'origen_lng',
  'destino_texto',
  'destino_lat',
  'destino_lng',
  'fecha_hora_servicio',
  'vuelo_codigo',
  'punto_encuentro',
  'tipo_pago',
  'perfil_pasajero',
  'responsable_pago',
  'vehiculo_preferencia',
  'pasajeros_cantidad',
  'equipaje_nivel',
  'pasajero_dni',
  'pasajero_ruc',
];

export type ExtraerReservaConFallbackOptions = {
  provider?: LLMProvider;
  timeoutMs?: number;
  logger?: Parameters<typeof withFallback<ExtraccionReservaResultado>>[0]['logger'];
};

function mezclarConDeterministico(
  llm: LlmExtraccion,
  deterministico: ExtraccionReservaResultado,
): ExtraccionReservaResultado {
  const reserva: ReservaExtraida = { ...llm.reserva };
  for (const campo of CAMPOS_DETERMINISTICOS_PRIORITARIOS) {
    const value = deterministico.reserva[campo];
    if (value !== null && value !== '') {
      reserva[campo] = value as never;
    }
  }

  return extraccionReservaResultadoSchema.parse({
    ...llm,
    reserva,
    fuente: 'llm',
    confianza: Math.max(llm.confianza, deterministico.confianza),
    motivo: `${llm.motivo} Validado contra reglas determinísticas.`,
    campos_esperados: Array.from(
      new Set([...deterministico.campos_esperados, ...llm.campos_esperados]),
    ),
    campos_extraidos: Array.from(
      new Set([...deterministico.campos_extraidos, ...llm.campos_extraidos]),
    ),
    preguntas_aclaracion: Array.from(
      new Set([...deterministico.preguntas_aclaracion, ...llm.preguntas_aclaracion]),
    ),
  });
}

export async function extraerReservaConFallback(
  input: ExtractorInput,
  options: ExtraerReservaConFallbackOptions = {},
): Promise<ExtraccionReservaResultado> {
  const deterministico = extraerReservaDeterminista(input);
  const provider = options.provider ?? new AnthropicProvider();

  const resultado = await withFallback({
    capacidad: 'ingesta',
    timeoutMs: options.timeoutMs ?? 5000,
    logger: options.logger,
    algoritmo: () => deterministico,
    llm: async () => {
      const prompt = renderPrompt('ingesta-whatsapp.v1', {
        fecha_actual_iso: input.fechaActualIso,
        contexto_conversacion: input.contextoConversacion,
        mensaje: input.mensaje,
        deterministico_json: JSON.stringify(deterministico, null, 2),
      });
      const llm = await provider.generateObject<LlmExtraccion>({
        prompt,
        schema: llmExtraccionSchema,
        timeoutMs: options.timeoutMs ?? 5000,
      });
      return mezclarConDeterministico(llm, deterministico);
    },
  });

  if (resultado.fuente === 'algoritmo') {
    return {
      ...resultado.resultado,
      fuente: 'algoritmo',
      motivo:
        resultado.motivo === 'flag_off'
          ? `${deterministico.motivo} IA_HABILITADA=false.`
          : `${deterministico.motivo} Fallback por error/timeout LLM.`,
    };
  }

  return {
    ...resultado.resultado,
    fuente: 'llm',
    modelo: provider.name,
  };
}
