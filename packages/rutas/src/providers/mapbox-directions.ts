import type { RouteLineString, RouteProvider, RouteRequest, RouteResult } from '../types';

type FetchLike = typeof fetch;

type MapboxRoute = {
  distance?: unknown;
  duration?: unknown;
  duration_typical?: unknown;
  geometry?: unknown;
  legs?: Array<{ duration_typical?: unknown }>;
};

type MapboxResponse = {
  code?: unknown;
  message?: unknown;
  routes?: MapboxRoute[];
};

function assertLineString(value: unknown): RouteLineString {
  if (!value || typeof value !== 'object') throw new Error('mapbox_geometry_invalida');
  const record = value as Record<string, unknown>;
  if (record.type !== 'LineString' || !Array.isArray(record.coordinates)) {
    throw new Error('mapbox_geometry_invalida');
  }

  const coordinates = record.coordinates.map((coordinate) => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) throw new Error('mapbox_geometry_invalida');
    const [lng, lat] = coordinate;
    if (typeof lng !== 'number' || typeof lat !== 'number') throw new Error('mapbox_geometry_invalida');
    return [lng, lat] as [number, number];
  });

  if (coordinates.length < 2) throw new Error('mapbox_geometry_invalida');
  return { type: 'LineString', coordinates };
}

function typicalDuration(route: MapboxRoute) {
  if (typeof route.duration_typical === 'number') return Math.round(route.duration_typical);
  const legDurations = route.legs
    ?.map((leg) => leg.duration_typical)
    .filter((value): value is number => typeof value === 'number');
  if (!legDurations || legDurations.length === 0) return null;
  return Math.round(legDurations.reduce((sum, value) => sum + value, 0));
}

export class MapboxDirectionsProvider implements RouteProvider {
  private readonly fetchImpl: FetchLike;
  private readonly token: string | undefined;

  constructor(options: { token?: string; fetchImpl?: FetchLike } = {}) {
    this.token = options.token ?? process.env.MAPBOX_SERVER_TOKEN;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async calcular(request: RouteRequest): Promise<RouteResult> {
    if (!this.token) throw new Error('mapbox_token_faltante');

    const perfil = request.perfil ?? 'driving-traffic';
    const profilePath = `mapbox/${perfil}`;
    const coordinates = `${request.origen.lng},${request.origen.lat};${request.destino.lng},${request.destino.lat}`;
    const url = new URL(`https://api.mapbox.com/directions/v5/${profilePath}/${coordinates}`);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'full');
    url.searchParams.set('annotations', 'duration,distance');
    if (perfil === 'driving-traffic') url.searchParams.set('depart_at', 'now');
    url.searchParams.set('access_token', this.token);

    const response = await this.fetchImpl(url);
    const payload = (await response.json().catch(() => null)) as MapboxResponse | null;
    if (!response.ok || !payload || payload.code !== 'Ok') {
      throw new Error(
        typeof payload?.message === 'string' ? payload.message : `mapbox_http_${response.status}`,
      );
    }

    const route = payload.routes?.[0];
    if (!route || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
      throw new Error('mapbox_route_vacia');
    }

    return {
      distanciaMetros: Math.round(route.distance),
      duracionSegundos: Math.round(route.duration),
      duracionSinTraficoSegundos: typicalDuration(route),
      geometry: assertLineString(route.geometry),
      fuente: 'mapbox',
      calculadoEn: new Date().toISOString(),
    };
  }
}
