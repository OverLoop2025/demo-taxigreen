import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/features/api/client';
import type { DriverAssignment } from '@/features/assignment/types';
import type { DriverLocation } from '@/features/location';
import { env } from '@/lib/env';

export type DriverRouteLineString = {
  type: 'LineString';
  coordinates: number[][];
};

export type DriverRoutePaso = {
  instruccion: string;
  distanciaMetros: number;
  tipo: string;
  modifier: string | null;
  nombre: string | null;
};

export type DriverRouteResult = {
  distanciaMetros: number | null;
  duracionSegundos: number | null;
  duracionSinTraficoSegundos: number | null;
  geometry: DriverRouteLineString | null;
  fuente: 'mapbox' | 'estimacion';
  calculadoEn: string | null;
  pasos: DriverRoutePaso[];
  cache?: string;
};

type UseDriverRouteArgs = {
  assignment: DriverAssignment | null;
  driverLocation: DriverLocation | null;
  token: string | null | undefined;
};

const MIN_RECALC_METERS = env.EXPO_PUBLIC_RUTAS_UMBRAL_RECALCULO_M;
const MIN_RECALC_MS = env.EXPO_PUBLIC_RUTAS_INTERVALO_MIN_S * 1000;

type LatLng = { lat: number; lng: number };

function toPoint(point: { lat: number | null; lng: number | null }): LatLng | null {
  return typeof point.lat === 'number' && typeof point.lng === 'number'
    ? { lat: point.lat, lng: point.lng }
    : null;
}

function distanceMeters(a: LatLng, b: LatLng) {
  const earth = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Tramo a trazar SIEMPRE como ruta real por calles (nunca recta). Devuelve dos
// puntos reales y distintos según la fase; el endpoint /api/rutas/calcular los
// convierte en polilínea Mapbox. a_bordo → destino; aproximación (GPS lejos del
// recojo) → recojo; resto (en_punto/finalizado/sin GPS) → viaje completo.
function legForPhase(assignment: DriverAssignment, driverLocation: DriverLocation | null): { start: LatLng; end: LatLng } | null {
  const origin = toPoint(assignment.origen);
  const destination = toPoint(assignment.destino);
  const driver = driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null;
  const estado = assignment.viaje?.estado;

  if (estado === 'a_bordo' && destination) {
    return { start: driver ?? origin ?? destination, end: destination };
  }

  const aproximando = estado === 'asignado' || estado === 'en_camino' || estado === 'en_punto' || !estado;
  if (aproximando && driver && origin && distanceMeters(driver, origin) > MIN_RECALC_METERS) {
    return { start: driver, end: origin };
  }

  if (origin && destination) return { start: origin, end: destination };
  return null;
}

// Clave de tramo redondeada a ~110 m (3 decimales) para no recalcular el mismo
// tramo en cada tick de GPS; un tramo nuevo (cambió la fase o el conductor se
// movió lo suficiente) sí dispara recálculo inmediato.
function legKey(leg: { start: LatLng; end: LatLng }) {
  return `${leg.start.lat.toFixed(3)},${leg.start.lng.toFixed(3)}|${leg.end.lat.toFixed(3)},${leg.end.lng.toFixed(3)}`;
}

function emptyRoute(): DriverRouteResult {
  return {
    distanciaMetros: null,
    duracionSegundos: null,
    duracionSinTraficoSegundos: null,
    geometry: null,
    fuente: 'estimacion',
    calculadoEn: null,
    pasos: [],
  };
}

function isRealGeometry(result: DriverRouteResult) {
  return result.fuente === 'mapbox' && (result.geometry?.coordinates.length ?? 0) > 2;
}

export function useDriverRoute({ assignment, driverLocation, token }: UseDriverRouteArgs) {
  const [route, setRoute] = useState<DriverRouteResult>(emptyRoute);
  const [status, setStatus] = useState<'idle' | 'calculating' | 'ready' | 'fallback'>('idle');
  const lastCalcRef = useRef<{ key: string; ts: number } | null>(null);

  const leg = useMemo(() => (assignment ? legForPhase(assignment, driverLocation) : null), [assignment, driverLocation]);

  useEffect(() => {
    if (!assignment || !leg) {
      setRoute(emptyRoute());
      setStatus('idle');
      return;
    }

    if (!token) {
      // Sin token no hay ruta real; no dibujamos recta (geometry queda null).
      setRoute(emptyRoute());
      setStatus('fallback');
      return;
    }

    const key = legKey(leg);
    const last = lastCalcRef.current;
    const now = Date.now();
    if (last && last.key === key && now - last.ts < MIN_RECALC_MS) return;

    let cancelled = false;
    lastCalcRef.current = { key, ts: now };
    setStatus('calculating');

    void apiFetch<DriverRouteResult>('/api/rutas/calcular', {
      method: 'POST',
      token,
      body: {
        reserva_id: assignment.id,
        origen: leg.start,
        destino: leg.end,
        perfil: 'driving-traffic',
      },
    })
      .then((result) => {
        if (cancelled) return;
        const real = isRealGeometry(result);
        setRoute((current) => ({
          distanciaMetros: result.distanciaMetros,
          duracionSegundos: result.duracionSegundos,
          duracionSinTraficoSegundos: result.duracionSinTraficoSegundos,
          // Anti-degradación: sólo geometría real (>2 vértices) reemplaza el trazo.
          // Una estimación (recta de 2 puntos) nunca se dibuja: se conserva la
          // curva real previa si existe, o queda null.
          geometry: real ? result.geometry : current.fuente === 'mapbox' ? current.geometry : null,
          fuente: real || current.fuente === 'mapbox' ? 'mapbox' : result.fuente,
          calculadoEn: result.calculadoEn,
          // Las maniobras sólo acompañan a una geometría real; si no, conservamos
          // las previas (cuando ya teníamos ruta real) o vaciamos.
          pasos: real ? result.pasos ?? [] : current.fuente === 'mapbox' ? current.pasos : [],
          cache: result.cache,
        }));
        setStatus(real ? 'ready' : 'fallback');
      })
      .catch(() => {
        if (cancelled) return;
        // Error de red: conservamos lo que haya (nunca una recta), sólo marcamos fallback.
        setStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [assignment, leg, token]);

  return { route, status };
}
