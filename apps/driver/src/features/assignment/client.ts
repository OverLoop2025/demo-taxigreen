import { apiFetch } from '@/features/api/client';
import type { AssignmentStateResponse, DriverAssignment, EstadoViaje } from './types';

export function getDriverAssignment(reservaId: string, token: string) {
  return apiFetch<DriverAssignment>(`/api/conductor/asignacion/${reservaId}`, {
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
