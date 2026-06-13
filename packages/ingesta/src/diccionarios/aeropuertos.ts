import type { TipoViaje } from '../types';

// Normalizador local (sin tildes, minúsculas) para no crear un import circular con
// post-procesamiento, que a su vez importa AEROPUERTOS de este módulo.
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export type ZonaAeropuertoCodigo =
  | 'ARR_NAC'
  | 'ARR_INT'
  | 'DEP_NAC'
  | 'DEP_INT'
  | 'BOULEVARD_P2'
  | 'PARKING';

export type ZonaAeropuerto = {
  codigo: ZonaAeropuertoCodigo;
  /** Nombre legible para la reserva/UI. */
  nombre: string;
  piso: string;
  /** Punto de encuentro por defecto si el cliente no precisa uno. */
  puntoEncuentro: string;
};

export type AmbitoVuelo = 'nacional' | 'internacional';

export type AeropuertoCanonico = {
  nombre: string;
  /** Compat: nombre genérico de llegadas cuando no se distingue nac/int. */
  llegadaNombre: string;
  /** Nombre genérico de salidas cuando no se distingue nac/int. */
  salidaNombre: string;
  lat: number;
  lng: number;
  keywords: string[];
  puntosEncuentro: string[];
  zonas: Record<ZonaAeropuertoCodigo, ZonaAeropuerto>;
};

// Modelo realista del nuevo terminal Jorge Chávez (operativo 2025):
//   Piso 1 = Llegadas (nac/int) · Piso 2 = boulevard/vía libre · Piso 3 = Salidas
// (nac/int). Mismas coordenadas de edificio; el piso/zona vive en el nombre y el
// punto de encuentro. Taxi Green opera llegadas Piso 1 y vía elevada Piso 3.
export const AEROPUERTOS: AeropuertoCanonico[] = [
  {
    nombre: 'Aeropuerto Jorge Chávez',
    llegadaNombre: 'Aeropuerto Jorge Chávez - Llegadas',
    salidaNombre: 'Aeropuerto Jorge Chávez - Salidas',
    lat: -12.0231,
    lng: -77.112,
    keywords: ['aeropuerto', 'jorge chavez', 'jorge chávez', 'lim', 'airport'],
    puntosEncuentro: ['Salida 3, columna F2', 'Counter de llegadas'],
    zonas: {
      ARR_NAC: {
        codigo: 'ARR_NAC',
        nombre: 'Aeropuerto Jorge Chávez - Llegadas Nacionales (Piso 1)',
        piso: 'Piso 1',
        puntoEncuentro: 'Counter Taxi Green, Llegadas Nacionales (Piso 1)',
      },
      ARR_INT: {
        codigo: 'ARR_INT',
        nombre: 'Aeropuerto Jorge Chávez - Llegadas Internacionales (Piso 1)',
        piso: 'Piso 1',
        puntoEncuentro: 'Counter Taxi Green, Llegadas Internacionales (Piso 1)',
      },
      DEP_NAC: {
        codigo: 'DEP_NAC',
        nombre: 'Aeropuerto Jorge Chávez - Salidas Nacionales (Piso 3)',
        piso: 'Piso 3',
        puntoEncuentro: 'Vía elevada de salidas, Embarque Nacional (Piso 3)',
      },
      DEP_INT: {
        codigo: 'DEP_INT',
        nombre: 'Aeropuerto Jorge Chávez - Salidas Internacionales (Piso 3)',
        piso: 'Piso 3',
        puntoEncuentro: 'Vía elevada de salidas, Embarque Internacional (Piso 3)',
      },
      BOULEVARD_P2: {
        codigo: 'BOULEVARD_P2',
        nombre: 'Aeropuerto Jorge Chávez - Boulevard / Vía libre (Piso 2)',
        piso: 'Piso 2',
        puntoEncuentro: 'Boulevard / Vía libre (Piso 2)',
      },
      PARKING: {
        codigo: 'PARKING',
        nombre: 'Aeropuerto Jorge Chávez - Estacionamiento',
        piso: 'Exterior',
        puntoEncuentro: 'Estacionamiento frente al terminal',
      },
    },
  },
];

// Ciudades/países que delatan un vuelo internacional o nacional cuando el cliente
// no escribe la palabra "internacional"/"nacional" explícitamente.
const DESTINOS_INTERNACIONALES = [
  'internacional',
  'miami',
  'madrid',
  'mexico',
  'bogota',
  'santiago',
  'buenos aires',
  'sao paulo',
  'panama',
  'new york',
  'nueva york',
  'estados unidos',
  'eeuu',
  'usa',
  'europa',
  'extranjero',
];

const DESTINOS_NACIONALES = [
  'nacional',
  'cusco',
  'cuzco',
  'arequipa',
  'piura',
  'trujillo',
  'chiclayo',
  'iquitos',
  'tarapoto',
  'juliaca',
  'tacna',
  'cajamarca',
  'ayacucho',
  'pucallpa',
];

export function detectarAmbitoVuelo(texto: string): AmbitoVuelo | null {
  const normalized = normalizar(texto);
  if (DESTINOS_INTERNACIONALES.some((keyword) => normalized.includes(keyword))) return 'internacional';
  if (DESTINOS_NACIONALES.some((keyword) => normalized.includes(keyword))) return 'nacional';
  return null;
}

export type ZonaResuelta = {
  texto: string;
  lat: number;
  lng: number;
  puntoEncuentro: string | null;
};

/**
 * Resuelve la zona del aeropuerto según el flujo y el ámbito del vuelo.
 * - Flujo A (recojo/llegada) → ARR_NAC / ARR_INT (Piso 1).
 * - Flujo B (traslado/salida) → DEP_NAC / DEP_INT (Piso 3).
 * Si no se distingue nac/int, cae al nombre genérico (compat con el protagonista).
 */
export function resolverZonaAeropuerto(
  aeropuerto: AeropuertoCanonico,
  tipoViaje: TipoViaje | null,
  ambito: AmbitoVuelo | null,
): ZonaResuelta {
  const base = { lat: aeropuerto.lat, lng: aeropuerto.lng };
  if (tipoViaje === 'traslado_aeropuerto') {
    if (ambito === 'nacional') {
      return { ...base, texto: aeropuerto.zonas.DEP_NAC.nombre, puntoEncuentro: aeropuerto.zonas.DEP_NAC.puntoEncuentro };
    }
    if (ambito === 'internacional') {
      return { ...base, texto: aeropuerto.zonas.DEP_INT.nombre, puntoEncuentro: aeropuerto.zonas.DEP_INT.puntoEncuentro };
    }
    return { ...base, texto: aeropuerto.salidaNombre, puntoEncuentro: null };
  }

  // Recojo/llegada (flujo A) por defecto.
  if (ambito === 'nacional') {
    return { ...base, texto: aeropuerto.zonas.ARR_NAC.nombre, puntoEncuentro: aeropuerto.zonas.ARR_NAC.puntoEncuentro };
  }
  if (ambito === 'internacional') {
    return { ...base, texto: aeropuerto.zonas.ARR_INT.nombre, puntoEncuentro: aeropuerto.zonas.ARR_INT.puntoEncuentro };
  }
  return { ...base, texto: aeropuerto.llegadaNombre, puntoEncuentro: null };
}
