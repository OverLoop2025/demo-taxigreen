export type RutaFuente = 'mapbox' | 'estimacion';
export type RutaPerfil = 'driving-traffic' | 'driving';

export type PuntoGeo = {
  lat: number;
  lng: number;
};

export type RouteLineString = {
  type: 'LineString';
  coordinates: Array<[number, number]>;
};

export type RouteRequest = {
  origen: PuntoGeo;
  destino: PuntoGeo;
  perfil?: RutaPerfil;
};

export type RouteResult = {
  distanciaMetros: number;
  duracionSegundos: number;
  duracionSinTraficoSegundos: number | null;
  geometry: RouteLineString;
  fuente: RutaFuente;
  calculadoEn: string;
};

export type RouteProvider = {
  calcular: (request: RouteRequest) => Promise<RouteResult>;
};

export type RutaFallbackMotivo = 'flag_off' | 'fallback' | null;

export type RutaFallbackLogEvent = {
  fuente: RutaFuente;
  motivo: RutaFallbackMotivo;
  latenciaMs: number;
  ok: boolean;
};
