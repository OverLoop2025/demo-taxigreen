export type AeropuertoCanonico = {
  nombre: string;
  llegadaNombre: string;
  lat: number;
  lng: number;
  keywords: string[];
  puntosEncuentro: string[];
};

export const AEROPUERTOS: AeropuertoCanonico[] = [
  {
    nombre: 'Aeropuerto Jorge Chávez',
    llegadaNombre: 'Aeropuerto Jorge Chávez - Llegadas',
    lat: -12.0231,
    lng: -77.112,
    keywords: ['aeropuerto', 'jorge chavez', 'jorge chávez', 'lim', 'airport'],
    puntosEncuentro: ['Salida 3, columna F2', 'Zona llegadas internacionales'],
  },
];
