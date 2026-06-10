import { apiFetch } from '@/features/api/client';
import type {
  AssignmentStateResponse,
  DriverAssignment,
  DriverTripsResponse,
  EstadoViaje,
} from './types';

export function getDriverAssignment(reservaId: string, token: string) {
  return apiFetch<DriverAssignment>(`/api/conductor/asignacion/${reservaId}`, {
    token,
  });
}

// Asignación vigente del conductor (la más reciente no cancelada). Permite mostrar
// el viaje al abrir la app sin depender de un broadcast Realtime en vivo.
export function getActiveDriverAssignment(token: string) {
  return apiFetch<{ asignacion: DriverAssignment | null }>(`/api/conductor/asignacion/activa`, {
    token,
  });
}

// Historial de viajes del conductor (activos + cerrados) para la pestaña "Viajes".
export function getDriverTrips(token: string) {
  return apiFetch<DriverTripsResponse>(`/api/conductor/viajes`, {
    token,
  });
}

export function changeDriverAssignmentState({
  reservaId,
  token,
  estadoNuevo,
}: {
  reservaId: string;
  token: string;
  estadoNuevo: EstadoViaje;
}) {
  return apiFetch<AssignmentStateResponse>(`/api/conductor/asignacion/${reservaId}/estado`, {
    method: 'POST',
    token,
    body: {
      estado_nuevo: estadoNuevo,
    },
  });
}
