import type { RouteLineString, RoutePaso, RouteProvider, RouteRequest, RouteResult } from '../types';

type FetchLike = typeof fetch;

type MapboxManeuver = {
  instruction?: unknown;
  type?: unknown;
  modifier?: unknown;
};

type MapboxStep = {
  distance?: unknown;
  name?: unknown;
  maneuver?: MapboxManeuver;
};

type MapboxRoute = {
  distance?: unknown;
  duration?: unknown;
  duration_typical?: unknown;
  geometry?: unknown;
  legs?: Array<{ duration_typical?: unknown; steps?: MapboxStep[] }>;
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

// Aplana las maniobras de todas las legs en una lista en español lista para la UI.
function parsePasos(route: MapboxRoute): RoutePaso[] {
  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const pasos: RoutePaso[] = [];
  for (const step of steps) {
    const instruccion = typeof step.maneuver?.instruction === 'string' ? step.maneuver.instruction : null;
    if (!instruccion) continue;
    pasos.push({
      instruccion,
      distanciaMetros: typeof step.distance === 'number' ? Math.round(step.distance) : 0,
      tipo: typeof step.maneuver?.type === 'string' ? step.maneuver.type : 'continue',
      modifier: typeof step.maneuver?.modifier === 'string' ? step.maneuver.modifier : null,
      nombre: typeof step.name === 'string' && step.name.length > 0 ? step.name : null,
    });
  }
  return pasos;
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
    // Maniobras paso a paso en español para la guía tipo navegador del conductor.
    url.searchParams.set('steps', 'true');
    url.searchParams.set('language', 'es');
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
      pasos: parsePasos(route),
    };
  }
}
