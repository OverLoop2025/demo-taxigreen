import type { EstadoViaje, NextTripAction } from './types';

const nextActions: Partial<Record<EstadoViaje, NextTripAction>> = {
  asignado: {
    estado: 'en_camino',
    label: 'En camino',
    helper: 'Inicia ruta al punto de encuentro.',
  },
  en_camino: {
    estado: 'en_punto',
    label: 'Llegué',
    helper: 'Confirma que estás en Salida 3, columna F2.',
  },
  en_punto: {
    estado: 'a_bordo',
    label: 'Pasajero a bordo',
    helper: 'Confirma solo cuando el pasajero ya subió.',
  },
  a_bordo: {
    estado: 'finalizado',
    label: 'Servicio terminado',
    helper: 'Cierra el servicio y lo deja por liquidar.',
  },
};

export function getNextTripAction(estado: EstadoViaje | null | undefined) {
  return estado ? nextActions[estado] ?? null : null;
}

export function isTrackingState(estado: EstadoViaje | null | undefined) {
  return estado === 'en_camino' || estado === 'en_punto' || estado === 'a_bordo';
}

export function tripStatusLabel(estado: EstadoViaje | null | undefined) {
  if (estado === 'asignado') return 'Asignado';
  if (estado === 'en_camino') return 'En camino';
  if (estado === 'en_punto') return 'En el punto';
  if (estado === 'a_bordo') return 'Pasajero a bordo';
  if (estado === 'finalizado') return 'Servicio terminado';
  if (estado === 'cancelado') return 'Cancelado';
  return 'Sin viaje';
}
