import { haversineMetros, isValidPuntoGeo } from './geo';
import type { RouteRequest, RouteResult } from './types';

const DEFAULT_SINUOSIDAD = 1.35;
const DEFAULT_VELOCIDAD_KMH = 28;

function parsePositiveEnvNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function velocidadMediaKmh() {
  return parsePositiveEnvNumber('RUTAS_VELOCIDAD_KMH', DEFAULT_VELOCIDAD_KMH);
}

export function calcularRutaEstimada(
  request: RouteRequest,
  options: { velocidadKmh?: number; sinuosidad?: number; calculadoEn?: Date } = {},
): RouteResult {
  if (!isValidPuntoGeo(request.origen) || !isValidPuntoGeo(request.destino)) {
    throw new Error('coordenadas_invalidas');
  }

  const velocidadKmh = options.velocidadKmh ?? velocidadMediaKmh();
  const sinuosidad = options.sinuosidad ?? DEFAULT_SINUOSIDAD;
  const distanciaMetros = Math.max(0, haversineMetros(request.origen, request.destino) * sinuosidad);
  const velocidadMs = (velocidadKmh * 1000) / 3600;
  const duracionSegundos = velocidadMs > 0 ? Math.round(distanciaMetros / velocidadMs) : 0;

  return {
    distanciaMetros: Math.round(distanciaMetros),
    duracionSegundos,
    duracionSinTraficoSegundos: null,
    geometry: {
      type: 'LineString',
      coordinates: [
        [request.origen.lng, request.origen.lat],
        [request.destino.lng, request.destino.lat],
      ],
    },
    fuente: 'estimacion',
    calculadoEn: (options.calculadoEn ?? new Date()).toISOString(),
  };
}
