export type FuenteDecision = 'llm' | 'algoritmo';
export type Capacidad = 'ingesta' | 'racionalizacion' | 'clasificacion';

export interface ResultadoConFuente<TOutput> {
  resultado: TOutput;
  fuente: FuenteDecision;
  motivo: string | null;
  latenciaMs: number;
}

export interface WithFallbackArgs<TOutput> {
  llm: () => Promise<TOutput>;
  algoritmo: () => Promise<TOutput> | TOutput;
  timeoutMs?: number;
  capacidad: Capacidad;
  logger?: (event: {
    capacidad: Capacidad;
    fuente: FuenteDecision;
    motivo: string | null;
    latenciaMs: number;
    ok: boolean;
  }) => void;
}

function iaHabilitada(): boolean {
  return process.env.IA_HABILITADA === 'true';
}

export async function withFallback<TOutput>({
  llm,
  algoritmo,
  timeoutMs = 5000,
  capacidad,
  logger,
}: WithFallbackArgs<TOutput>): Promise<ResultadoConFuente<TOutput>> {
  const startedAt = Date.now();
  if (!iaHabilitada()) {
    const resultado = await algoritmo();
    const latenciaMs = Date.now() - startedAt;
    logger?.({ capacidad, fuente: 'algoritmo', motivo: 'flag_off', latenciaMs, ok: true });
    return { resultado, fuente: 'algoritmo', motivo: 'flag_off', latenciaMs };
  }
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const resultado = await Promise.race([
      llm(),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    clearTimeout(timeoutHandle);
    const latenciaMs = Date.now() - startedAt;
    logger?.({ capacidad, fuente: 'llm', motivo: null, latenciaMs, ok: true });
    return { resultado, fuente: 'llm', motivo: null, latenciaMs };
  } catch (err) {
    clearTimeout(timeoutHandle);
    const resultado = await algoritmo();
    const latenciaMs = Date.now() - startedAt;
    logger?.({ capacidad, fuente: 'algoritmo', motivo: 'fallback', latenciaMs, ok: false });
    console.warn(`[ia] LLM falló en "${capacidad}", usando fallback determinista`, err);
    return { resultado, fuente: 'algoritmo', motivo: 'fallback', latenciaMs };
  }
}
