/**
 * Copy humano compartido (web + driver) — Renovación Frontend Premium (F1).
 *
 * Regla rectora: nada de jerga técnica en superficies de cliente. Estas utilidades
 * son TS puro (sin React) para que las consuman tanto `apps/web` como `apps/driver`.
 *
 * IMPORTANTE: esto reemplaza SOLO texto visible. Nunca renombrar identificadores,
 * columnas (`score_sugerido`), params de ruta (`/p/[token]`), enums ni tests.
 */

/** Estados de viaje del conductor/pasajero (espejo de `EstadoViaje` en Prisma). */
export type EstadoViaje = 'asignado' | 'en_camino' | 'en_punto' | 'a_bordo' | 'finalizado' | 'cancelado';

/**
 * Diccionario de referencia técnico → humano. Útil como fuente de verdad del
 * microcopy y para auditar superficies. No es obligatorio usarlo en runtime.
 */
export const COPY_HUMANO: Record<string, string> = {
  ETA: 'Llega en',
  'Ruta real': 'Ruta actualizada',
  Estimación: 'Calculando ruta',
  'Realtime activo': 'En vivo',
  Polling: 'Actualizando',
  'Push registrado': 'Avisos activos',
  HMAC: 'QR protegido',
  'Consumir QR': 'Confirmar acceso',
  idempotente: 'de un solo uso',
  Cola: 'Turno',
  Pesos: 'Motivos',
  Score: 'Recomendado',
  Match: 'Encaja',
  Algoritmo: 'Modo seguro',
  IA: 'Copiloto',
  JSON: 'Detalle técnico',
  'WA Sim': 'WhatsApp',
  'Asignación manual': 'Elegir conductor',
  'Marcar excepción': 'Necesita revisión',
  Rating: 'Calificación',
  Pax: 'Personas',
  Tenant: 'Empresa',
  por_liquidar: 'Viaje cerrado',
};

/** "Llega en 8 min" / "Llegando" cuando faltan <1 min. Nunca "ETA". */
export function formatLlegada(minutos: number | null | undefined): string {
  if (minutos == null || !Number.isFinite(minutos)) return 'Calculando llegada';
  const m = Math.max(0, Math.ceil(minutos));
  if (m <= 0) return 'Llegando';
  if (m === 1) return 'Llega en 1 min';
  return `Llega en ${m} min`;
}

/** Texto humano del estado del viaje para el PASAJERO (sin jerga). */
export function estadoViajePasajero(estado: EstadoViaje): string {
  switch (estado) {
    case 'asignado':
      return 'Tu Taxi Green está confirmado';
    case 'en_camino':
      return 'Tu Taxi Green va en camino';
    case 'en_punto':
      return 'Tu Taxi Green te espera en el punto';
    case 'a_bordo':
      return 'En viaje a tu destino';
    case 'finalizado':
      return 'Viaje completado';
    case 'cancelado':
      return 'Viaje cancelado';
  }
}

type BannerOpts = { punto?: string; destino?: string };

/**
 * Banner superior estilo navegación para el CONDUCTOR.
 * El punto/destino se inyectan (no se hardcodea el flujo protagonista aquí).
 */
export function bannerConductor(estado: EstadoViaje, opts: BannerOpts = {}): string {
  const punto = opts.punto?.trim();
  const destino = opts.destino?.trim();
  switch (estado) {
    case 'asignado':
      return 'Ve al punto de recojo';
    case 'en_camino':
      return punto ? `Dirígete a ${punto}` : 'Dirígete al punto de encuentro';
    case 'en_punto':
      return 'Espera al pasajero';
    case 'a_bordo':
      return destino ? `Lleva al pasajero a ${destino}` : 'Lleva al pasajero al destino';
    case 'finalizado':
      return 'Viaje terminado';
    case 'cancelado':
      return 'Viaje cancelado';
  }
}

/** Etiqueta de la acción principal del conductor según el estado (una sola acción). */
export function accionConductor(estado: EstadoViaje): string | null {
  switch (estado) {
    case 'asignado':
      return 'Voy al punto';
    case 'en_camino':
      return 'Ya llegué';
    case 'en_punto':
      return 'Iniciar viaje';
    case 'a_bordo':
      return 'Finalizar';
    case 'finalizado':
    case 'cancelado':
      return null;
  }
}
