export { calcularRutaEstimada, velocidadMediaKmh } from './estimador';
export { haversineMetros, isValidPuntoGeo } from './geo';
export { MapboxDirectionsProvider } from './providers/mapbox-directions';
export { withRutaFallback } from './with-ruta-fallback';
export type {
  PuntoGeo,
  RouteLineString,
  RoutePaso,
  RouteProvider,
  RouteRequest,
  RouteResult,
  RutaFallbackLogEvent,
  RutaFallbackMotivo,
  RutaFuente,
  RutaPerfil,
} from './types';
