import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/features/api/client';
import type { DriverAssignment } from '@/features/assignment/types';
import type { DriverLocation } from '@/features/location';
import { env } from '@/lib/env';

export type DriverRouteLineString = {
  type: 'LineString';
  coordinates: number[][];
};

export type DriverRouteResult = {
  distanciaMetros: number | null;
  duracionSegundos: number | null;
  duracionSinTraficoSegundos: number | null;
  geometry: DriverRouteLineString | null;
  fuente: 'mapbox' | 'estimacion';
  calculadoEn: string | null;
  cache?: string;
};

type UseDriverRouteArgs = {
  assignment: DriverAssignment | null;
  driverLocation: DriverLocation | null;
  token: string | null | undefined;
};

const MIN_RECALC_METERS = env.EXPO_PUBLIC_RUTAS_UMBRAL_RECALCULO_M;
const MIN_RECALC_MS = env.EXPO_PUBLIC_RUTAS_INTERVALO_MIN_S * 1000;

function toPoint(point: { lat: number | null; lng: number | null }) {
  return typeof point.lat === 'number' && typeof point.lng === 'number'
    ? { lat: point.lat, lng: point.lng }
    : null;
}

function targetForPhase(assignment: DriverAssignment) {
  const estado = assignment.viaje?.estado;
  if (estado === 'a_bordo') return toPoint(assignment.destino);
  if (estado === 'en_punto' || estado === 'finalizado') return null;
  return toPoint(assignment.origen);
}

function fallbackGeometry(assignment: DriverAssignment, driverLocation: DriverLocation | null) {
  const origin = toPoint(assignment.origen);
  const destination = toPoint(assignment.destino);
  const driver = driverLocation ?? origin;
  const points = [driver, origin, destination]
    .filter((point): point is { lat: number; lng: number } => Boolean(point))
    .map((point) => [point.lng, point.lat]);
  return points.length >= 2 ? { type: 'LineString' as const, coordinates: points } : null;
}

function distanceMeters(a: DriverLocation, b: DriverLocation) {
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

function initialRoute(assignment: DriverAssignment | null, driverLocation: DriverLocation | null): DriverRouteResult {
  return {
    distanciaMetros: null,
    duracionSegundos: null,
    duracionSinTraficoSegundos: null,
    geometry: assignment ? fallbackGeometry(assignment, driverLocation) : null,
    fuente: 'estimacion',
    calculadoEn: null,
  };
}

export function useDriverRoute({ assignment, driverLocation, token }: UseDriverRouteArgs) {
  const [route, setRoute] = useState<DriverRouteResult>(() => initialRoute(assignment, driverLocation));
  const [status, setStatus] = useState<'idle' | 'calculating' | 'ready' | 'fallback'>('idle');
  const lastCalcRef = useRef<{ location: DriverLocation; ts: number; phase: string | null } | null>(null);
  const phase = assignment?.viaje?.estado ?? null;

  const target = useMemo(() => (assignment ? targetForPhase(assignment) : null), [assignment]);

  useEffect(() => {
    if (!assignment) {
      setRoute(initialRoute(null, null));
      setStatus('idle');
      return;
    }

    if (!target) {
      setRoute({
        distanciaMetros: 0,
        duracionSegundos: 0,
        duracionSinTraficoSegundos: null,
        geometry: fallbackGeometry(assignment, driverLocation),
        fuente: 'estimacion',
        calculadoEn: new Date().toISOString(),
      });
      setStatus('ready');
      return;
    }

    const origin = driverLocation ?? toPoint(assignment.origen);
    if (!origin) {
      setRoute(initialRoute(assignment, driverLocation));
      setStatus('fallback');
      return;
    }

    const normalizedLocation: DriverLocation = {
      lat: origin.lat,
      lng: origin.lng,
      heading: driverLocation?.heading ?? null,
      speed: driverLocation?.speed ?? null,
      ts: driverLocation?.ts ?? new Date().toISOString(),
    };
    const last = lastCalcRef.current;
    const now = Date.now();
    if (last && last.phase === phase) {
      const movedEnough = distanceMeters(last.location, normalizedLocation) >= MIN_RECALC_METERS;
      const waitedEnough = now - last.ts >= MIN_RECALC_MS;
      if (!movedEnough || !waitedEnough) return;
    }

    if (!token) {
      setRoute(initialRoute(assignment, driverLocation));
      setStatus('fallback');
      return;
    }

    let cancelled = false;
    lastCalcRef.current = { location: normalizedLocation, ts: now, phase };
    setStatus('calculating');

    void apiFetch<DriverRouteResult>('/api/rutas/calcular', {
      method: 'POST',
      token,
      body: {
        reserva_id: assignment.id,
        origen: { lat: normalizedLocation.lat, lng: normalizedLocation.lng },
        destino: target,
        perfil: 'driving-traffic',
      },
    })
      .then((result) => {
        if (cancelled) return;
        setRoute({
          distanciaMetros: result.distanciaMetros,
          duracionSegundos: result.duracionSegundos,
          duracionSinTraficoSegundos: result.duracionSinTraficoSegundos,
          geometry: result.geometry,
          fuente: result.fuente,
          calculadoEn: result.calculadoEn,
          cache: result.cache,
        });
        setStatus(result.fuente === 'mapbox' ? 'ready' : 'fallback');
      })
      .catch(() => {
        if (cancelled) return;
        setRoute(initialRoute(assignment, driverLocation));
        setStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [assignment, driverLocation, phase, target, token]);

  return { route, status };
}
