import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { getDriverSupabaseClient } from '@/features/realtime/client';

export type DriverLocation = {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  ts: string;
};

type TrackingStatus = 'idle' | 'requesting_permission' | 'tracking' | 'permission_denied' | 'realtime_disabled' | 'error';

export type LocationTrackingState = {
  status: TrackingStatus;
  lastLocation: DriverLocation | null;
  error: string | null;
};

export async function solicitarPermisoForeground() {
  const permission = await Location.requestForegroundPermissionsAsync();
  return permission.status === Location.PermissionStatus.GRANTED;
}

function normalizeLocation(location: Location.LocationObject): DriverLocation {
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    heading: location.coords.heading ?? null,
    speed: location.coords.speed ?? null,
    ts: new Date(location.timestamp).toISOString(),
  };
}

export function useLocationTracking(reservaId: string | null, activo: boolean): LocationTrackingState {
  const [state, setState] = useState<LocationTrackingState>({
    status: 'idle',
    lastLocation: null,
    error: null,
  });

  useEffect(() => {
    if (!reservaId || !activo) {
      setState((current) => ({ ...current, status: 'idle' }));
      return;
    }

    const supabase = getDriverSupabaseClient();
    if (!supabase) {
      setState((current) => ({ ...current, status: 'realtime_disabled' }));
      return;
    }

    let cancelled = false;
    let realtimeReady = false;
    let subscription: Location.LocationSubscription | null = null;
    const channel = supabase.channel(`reserva-${reservaId}`);

    async function start() {
      setState((current) => ({ ...current, status: 'requesting_permission', error: null }));
      const granted = await solicitarPermisoForeground();
      if (cancelled) return;

      if (!granted) {
        setState((current) => ({ ...current, status: 'permission_denied' }));
        return;
      }

      channel.subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') {
          realtimeReady = true;
        }
        if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
          realtimeReady = false;
          // La navegación depende del GPS local, no del broadcast. Si Realtime no
          // acepta el canal, degradamos en silencio y el siguiente montaje/refresh
          // volverá a intentar suscribirse.
          setState((current) => ({
            ...current,
            status: current.lastLocation ? 'tracking' : current.status,
            error: null,
          }));
        }
      });

      // Navegación activa: alta precisión (proveedor GPS) e intervalos cortos. El
      // puck del conductor debe nacer de su posición real; Balanced (red/fusionado)
      // podía no entregar la ubicación —incluida la del emulador con `geo fix`—.
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          const normalized = normalizeLocation(location);
          setState({ status: 'tracking', lastLocation: normalized, error: null });

          if (!realtimeReady) return;
          void channel.send({
            type: 'broadcast',
            event: 'posicion',
            payload: normalized,
          });
        },
      );

      if (!cancelled) {
        setState((current) => ({ ...current, status: 'tracking', error: null }));
      }
    }

    void start().catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : 'No se pudo iniciar ubicación.';
      setState((current) => ({ ...current, status: 'error', error: message }));
    });

    return () => {
      cancelled = true;
      subscription?.remove();
      void supabase.removeChannel(channel);
    };
  }, [activo, reservaId]);

  return state;
}
