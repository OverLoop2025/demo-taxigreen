export type TipoViajeAsignacion = 'recojo_aeropuerto' | 'traslado_aeropuerto' | 'city';
export type TipoVehiculoAsignacion = 'sedan' | 'camioneta' | 'van' | 'minivan';
export type FuenteSugerencia = 'llm' | 'algoritmo';

export interface ReservaAsignacionInput {
  id: string;
  tenantId?: string;
  voucherCodigo?: string;
  tipoViaje: TipoViajeAsignacion;
  origenTexto: string;
  origenLat?: number | null;
  origenLng?: number | null;
  destinoTexto: string;
  fechaHoraServicio?: Date | string | null;
  pasajeros?: number | null;
  tipoVehiculoPreferido?: TipoVehiculoAsignacion | null;
}

export interface ConductorCandidatoInput {
  id: string;
  nombre: string;
  rating: number;
  totalViajes: number;
  tiempoEnColaDesde: Date | string | null;
  vehiculoId?: string | null;
  fotoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanciaMockKm?: number | null;
}

export interface VehiculoCandidatoInput {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculoAsignacion;
  capacidad: number;
  color?: string | null;
  anio?: number | null;
}

export interface PesosAsignacion {
  cola: number;
  distancia: number;
  match: number;
}

export interface FactoresAsignacion {
  ordenCola: number | null;
  minutosEnCola: number | null;
  colaScore: number;
  distanciaKm: number;
  distanciaScore: number;
  matchScore: number;
  pasajerosRequeridos: number;
  capacidadUnidad: number;
  capacidadSuficiente: boolean;
  pesos: PesosAsignacion;
}

export interface ConductorSugerido {
  id: string;
  nombre: string;
  rating: number;
  totalViajes: number;
  tiempoEnColaDesde: string | null;
  fotoUrl: string | null;
}

export interface VehiculoSugerido {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculoAsignacion;
  capacidad: number;
  color: string | null;
  anio: number | null;
}

export interface CandidatoAsignacion {
  conductor: ConductorSugerido;
  vehiculo: VehiculoSugerido;
  score: number;
  razon: string;
  factores: FactoresAsignacion;
}

export interface SugerenciaAsignacion {
  reservaId: string;
  tenantId: string;
  contexto: {
    voucherCodigo: string | null;
    tipoViaje: TipoViajeAsignacion;
    origenTexto: string;
    destinoTexto: string;
  };
  conductor: ConductorSugerido;
  vehiculo: VehiculoSugerido;
  razon: string;
  score: number;
  factores: FactoresAsignacion;
  fuente: FuenteSugerencia;
  motivo: string | null;
  modelo: string | null;
  candidatos: CandidatoAsignacion[];
  generadoEn: string;
}
