import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function extractReservaId(data: Notifications.NotificationContent['data']) {
  const reservaId = data?.reservaId;
  return typeof reservaId === 'string' && reservaId.length > 0 ? reservaId : null;
}

export function extractIncidentNavigation(data: Notifications.NotificationContent['data']) {
  const screen = data?.screen;
  const incidenciaId = data?.incidenciaId;
  if (screen !== 'incidencia' || typeof incidenciaId !== 'string' || incidenciaId.length === 0) {
    return null;
  }

  return {
    incidenciaId,
    reservaId: typeof data?.reservaId === 'string' ? data.reservaId : undefined,
    descripcion: typeof data?.descripcion === 'string' ? data.descripcion : undefined,
  };
}

/**
 * Observa SOLO los taps de notificación con la app viva (foreground/background).
 * El caso cold-start (app cerrada → tap) lo resuelve `app/index.tsx` leyendo
 * `getLastNotificationResponseAsync()`, para no competir con su redirect inicial
 * (si ambos navegaran, el `replace` de index pisaría la pantalla de asignación).
 */
export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const incident = extractIncidentNavigation(data);
      if (incident) {
        router.push({
          pathname: '/(auth)/incidencia/[id]' as never,
          params: {
            id: incident.incidenciaId,
            reservaId: incident.reservaId,
            descripcion: incident.descripcion,
          },
        });
        return;
      }

      const reservaId = extractReservaId(data);
      if (reservaId) {
        router.push({ pathname: '/(auth)/asignacion/[id]', params: { id: reservaId } });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);
}
