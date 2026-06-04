import { describe, expect, it, vi } from 'vitest';
import { calcularRutaEstimada } from './estimador';
import { withRutaFallback } from './with-ruta-fallback';
import type { RouteProvider, RouteRequest } from './types';

const request: RouteRequest = {
  origen: { lat: -12.0231, lng: -77.112 },
  destino: { lat: -12.1196, lng: -77.0365 },
  perfil: 'driving-traffic',
};

describe('packages/rutas', () => {
  it('calcula estimación determinista con sinuosidad y velocidad media', () => {
    const result = calcularRutaEstimada(request, {
      calculadoEn: new Date('2026-06-01T00:00:00.000Z'),
      velocidadKmh: 28,
      sinuosidad: 1.35,
    });

    expect(result.fuente).toBe('estimacion');
    expect(result.distanciaMetros).toBeGreaterThan(14_000);
    expect(result.distanciaMetros).toBeLessThan(19_000);
    expect(result.duracionSegundos).toBeGreaterThan(1700);
    expect(result.geometry.coordinates).toEqual([
      [-77.112, -12.0231],
      [-77.0365, -12.1196],
    ]);
    expect(result.calculadoEn).toBe('2026-06-01T00:00:00.000Z');
  });

  it('usa estimación y no llama proveedor cuando RUTAS_HABILITADAS está apagado', async () => {
    vi.stubEnv('RUTAS_HABILITADAS', 'false');
    const provider: RouteProvider = { calcular: vi.fn() };

    const result = await withRutaFallback({ request, provider });

    expect(result.fuente).toBe('estimacion');
    expect(provider.calcular).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('degrada a estimación si el proveedor real falla', async () => {
    vi.stubEnv('RUTAS_HABILITADAS', 'true');
    const provider: RouteProvider = { calcular: vi.fn().mockRejectedValue(new Error('mapbox_down')) };

    const result = await withRutaFallback({ request, provider });

    expect(result.fuente).toBe('estimacion');
    expect(provider.calcular).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it('degrada a estimación en timeout', async () => {
    vi.stubEnv('RUTAS_HABILITADAS', 'true');
    const provider: RouteProvider = {
      calcular: vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(calcularRutaEstimada(request)), 50);
          }),
      ) as RouteProvider['calcular'],
    };

    const result = await withRutaFallback({ request, provider, timeoutMs: 1 });

    expect(result.fuente).toBe('estimacion');
    expect(provider.calcular).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });
});
