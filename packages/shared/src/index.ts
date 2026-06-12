/**
 * @taxigreen/shared — tipos, design tokens (paleta AZUL dual) y helpers
 * compartidos por apps/web y apps/driver. Placeholder de Sprint 0.
 */
export * from './tokens';
export * from './copy';
export * from './comercial';

/** Constantes canónicas del flujo protagonista (no invertir el flujo). */
export const FLUJO_PROTAGONISTA = {
  tipoViaje: 'recojo_aeropuerto',
  origenTexto: 'Aeropuerto Jorge Chávez - Llegadas',
  puntoEncuentro: 'Salida 3, columna F2',
  destinoTexto: 'Av. Pardo 123, Miraflores',
  vueloEjemplo: 'LA2456',
} as const;
