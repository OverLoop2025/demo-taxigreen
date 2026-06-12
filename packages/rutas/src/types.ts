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

/**
 * Maniobra de la ruta (giro/indicación) para guía tipo navegador.
 * `instruccion` viene localizada en español; `distanciaMetros` es la longitud del
 * tramo que sigue a esta maniobra hasta la próxima.
 */
export type RoutePaso = {
  instruccion: string;
  distanciaMetros: number;
  tipo: string;
  modifier: string | null;
  nombre: string | null;
  /** [lng, lat] de la maniobra: permite guía dinámica (próximo giro según GPS). */
  location: [number, number] | null;
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
  /** Maniobras paso a paso (sólo proveedor real; la estimación no las trae). */
  pasos?: RoutePaso[];
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
