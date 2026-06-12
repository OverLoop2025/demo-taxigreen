import type { DriverRouteLineString, DriverRoutePaso } from './use-route';

type LatLng = { lat: number; lng: number };

export type ProximaManiobra = {
  paso: DriverRoutePaso;
  /** Metros desde la posición actual hasta la maniobra, medidos a lo largo de la ruta. */
  distanciaMetros: number | null;
};

function haversineMeters(a: LatLng, b: LatLng) {
  const earth = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestVertexIndex(coordinates: number[][], point: LatLng) {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coordinates.length; i += 1) {
    const [lng, lat] = coordinates[i] ?? [];
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    const dist = haversineMeters(point, { lat, lng });
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

// Distancia acumulada a lo largo de la polilínea, por vértice.
function cumulativeDistances(coordinates: number[][]) {
  const cum: number[] = [0];
  for (let i = 1; i < coordinates.length; i += 1) {
    const [lngA, latA] = coordinates[i - 1] ?? [];
    const [lngB, latB] = coordinates[i] ?? [];
    const prev = cum[i - 1] ?? 0;
    if (
      typeof lngA !== 'number' ||
      typeof latA !== 'number' ||
      typeof lngB !== 'number' ||
      typeof latB !== 'number'
    ) {
      cum.push(prev);
      continue;
    }
    cum.push(prev + haversineMeters({ lat: latA, lng: lngA }, { lat: latB, lng: lngB }));
  }
  return cum;
}

// Una maniobra se considera ejecutada cuando el conductor está a menos de esta
// distancia (o ya la dejó atrás sobre la línea): el banner salta a la siguiente.
const MANIOBRA_EJECUTADA_M = 25;

/**
 * Próximo giro según el avance REAL del conductor sobre la ruta.
 *
 * El cálculo de ruta entrega las maniobras una sola vez; entre recálculos el
 * conductor sigue avanzando. Mostrar siempre `pasos[1]` desfasa el banner (puede
 * anunciar un giro ya ejecutado, incluso con el lado contrario al que se ve en
 * pantalla). Aquí proyectamos el GPS sobre la polilínea y elegimos la primera
 * maniobra que sigue estando POR DELANTE, con su distancia restante real.
 *
 * Fallback sin GPS/geometría/locations: primera maniobra de giro (comportamiento
 * previo), para no dejar el banner vacío.
 */
export function proximaManiobra(args: {
  pasos: DriverRoutePaso[];
  geometry: DriverRouteLineString | null;
  gps: LatLng | null;
}): ProximaManiobra | null {
  const { pasos, geometry, gps } = args;
  if (pasos.length === 0) return null;

  const fallback = (): ProximaManiobra => {
    const idx = pasos.length > 1 ? 1 : 0;
    const paso = pasos[idx] ?? pasos[0]!;
    return {
      paso,
      distanciaMetros: pasos.length > 1 ? pasos[0]?.distanciaMetros ?? null : paso.distanciaMetros,
    };
  };

  const coordinates = geometry?.coordinates ?? [];
  const conLocation = pasos.filter((paso) => paso.location !== null);
  if (!gps || coordinates.length < 2 || conLocation.length === 0) return fallback();

  const cum = cumulativeDistances(coordinates);
  const idxGps = nearestVertexIndex(coordinates, gps);
  const avance = cum[idxGps] ?? 0;

  for (const paso of conLocation) {
    const [lng, lat] = paso.location!;
    const idxPaso = nearestVertexIndex(coordinates, { lat, lng });
    const restante = (cum[idxPaso] ?? 0) - avance;
    if (restante > MANIOBRA_EJECUTADA_M) {
      return { paso, distanciaMetros: Math.round(restante) };
    }
  }

  // Todas las maniobras quedaron atrás: estamos llegando (mostrar la última).
  const ultima = conLocation[conLocation.length - 1]!;
  return { paso: ultima, distanciaMetros: null };
}
