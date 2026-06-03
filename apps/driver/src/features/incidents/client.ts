import { apiFetch } from '@/features/api/client';
import type { DriverIncidentAnswer, DriverIncidentResponse } from './types';

export function respondDriverIncident({
  incidenciaId,
  token,
  respuesta,
}: {
  incidenciaId: string;
  token: string;
  respuesta: DriverIncidentAnswer;
}) {
  return apiFetch<DriverIncidentResponse>(`/api/incidencias/${incidenciaId}/responder`, {
    method: 'POST',
    token,
    body: { respuesta },
  });
}
