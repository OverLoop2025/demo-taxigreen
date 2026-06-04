import { calcularRutaEstimada } from './estimador';
import { MapboxDirectionsProvider } from './providers/mapbox-directions';
import type { RouteProvider, RouteRequest, RouteResult, RutaFallbackLogEvent } from './types';

export type WithRutaFallbackArgs = {
  request: RouteRequest;
  provider?: RouteProvider;
  timeoutMs?: number;
  logger?: (event: RutaFallbackLogEvent) => void;
};

function rutasHabilitadas() {
  return process.env.RUTAS_HABILITADAS === 'true';
}

export async function withRutaFallback({
  request,
  provider = new MapboxDirectionsProvider(),
  timeoutMs = 2500,
  logger,
}: WithRutaFallbackArgs): Promise<RouteResult> {
  const startedAt = Date.now();

  if (!rutasHabilitadas()) {
    const resultado = calcularRutaEstimada(request);
    logger?.({ fuente: 'estimacion', motivo: 'flag_off', latenciaMs: Date.now() - startedAt, ok: true });
    return resultado;
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const resultado = await Promise.race([
      provider.calcular(request),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    clearTimeout(timeoutHandle);
    logger?.({ fuente: resultado.fuente, motivo: null, latenciaMs: Date.now() - startedAt, ok: true });
    return resultado;
  } catch (error) {
    clearTimeout(timeoutHandle);
    const resultado = calcularRutaEstimada(request);
    logger?.({ fuente: 'estimacion', motivo: 'fallback', latenciaMs: Date.now() - startedAt, ok: false });
    console.warn('[rutas] proveedor real falló; usando estimación determinista', error);
    return resultado;
  }
}
