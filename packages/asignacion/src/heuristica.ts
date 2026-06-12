import type {
  CandidatoAsignacion,
  ConductorCandidatoInput,
  ConductorSugerido,
  FactoresAsignacion,
  PesosAsignacion,
  ReservaAsignacionInput,
  TipoVehiculoAsignacion,
  VehiculoCandidatoInput,
  VehiculoSugerido,
} from './types';

const DEFAULT_PESOS: PesosAsignacion = {
  cola: 0.5,
  distancia: 0.3,
  match: 0.2,
};

export interface PuntuarCandidatosArgs {
  reserva: ReservaAsignacionInput;
  conductores: ConductorCandidatoInput[];
  vehiculos: VehiculoCandidatoInput[];
  now?: Date;
  pesos?: Partial<PesosAsignacion>;
}

function envWeight(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getPesosAsignacion(overrides: Partial<PesosAsignacion> = {}): PesosAsignacion {
  return {
    cola: overrides.cola ?? envWeight('ASIGNACION_PESO_COLA', DEFAULT_PESOS.cola),
    distancia:
      overrides.distancia ?? envWeight('ASIGNACION_PESO_DISTANCIA', DEFAULT_PESOS.distancia),
    match: overrides.match ?? envWeight('ASIGNACION_PESO_MATCH', DEFAULT_PESOS.match),
  };
}

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function minutesSince(value: Date | string | null | undefined, now: Date) {
  const date = asDate(value);
  if (!date) return null;
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stableMockDistance(conductorId: string) {
  const hash = Array.from(conductorId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 4 + (hash % 120) / 10;
}

function distanciaKm(reserva: ReservaAsignacionInput, conductor: ConductorCandidatoInput) {
  if (typeof conductor.distanciaMockKm === 'number' && conductor.distanciaMockKm > 0) {
    return conductor.distanciaMockKm;
  }

  if (
    typeof conductor.lat === 'number' &&
    typeof conductor.lng === 'number' &&
    typeof reserva.origenLat === 'number' &&
    typeof reserva.origenLng === 'number'
  ) {
    return Math.max(0.2, haversineKm(reserva.origenLat, reserva.origenLng, conductor.lat, conductor.lng));
  }

  return stableMockDistance(conductor.id);
}

function pasajerosRequeridos(reserva: ReservaAsignacionInput) {
  return Math.max(1, Math.round(reserva.pasajeros ?? 1));
}

function matchTipoServicio(
  tipoViaje: ReservaAsignacionInput['tipoViaje'],
  tipoVehiculo: TipoVehiculoAsignacion,
  pasajeros: number,
  tipoVehiculoPreferido?: TipoVehiculoAsignacion | null,
) {
  if (tipoVehiculoPreferido) {
    if (tipoVehiculo === tipoVehiculoPreferido) return 1;
    if (tipoVehiculoPreferido === 'camioneta' && tipoVehiculo === 'minivan') return 0.88;
    if (tipoVehiculoPreferido === 'minivan' && tipoVehiculo === 'van') return 0.88;
    if (tipoVehiculoPreferido === 'van' && tipoVehiculo === 'minivan' && pasajeros <= 6) return 0.82;
    return 0.62;
  }

  if (pasajeros > 4) {
    if (tipoVehiculo === 'van') return 1;
    if (tipoVehiculo === 'minivan') return 0.95;
    if (tipoVehiculo === 'camioneta') return 0.55;
    return 0.2;
  }

  if (tipoViaje === 'city') {
    if (tipoVehiculo === 'sedan' || tipoVehiculo === 'camioneta') return 1;
    if (tipoVehiculo === 'minivan') return 0.85;
    return 0.7;
  }

  if (tipoVehiculo === 'sedan' || tipoVehiculo === 'camioneta') return 1;
  if (tipoVehiculo === 'minivan') return 0.88;
  return 0.75;
}

function vehicleToSuggestion(vehicle: VehiculoCandidatoInput): VehiculoSugerido {
  return {
    id: vehicle.id,
    placa: vehicle.placa,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    tipo: vehicle.tipo,
    capacidad: vehicle.capacidad,
    color: vehicle.color ?? null,
    anio: vehicle.anio ?? null,
  };
}

function conductorToSuggestion(conductor: ConductorCandidatoInput): ConductorSugerido {
  return {
    id: conductor.id,
    nombre: conductor.nombre,
    rating: conductor.rating,
    totalViajes: conductor.totalViajes,
    tiempoEnColaDesde: asDate(conductor.tiempoEnColaDesde)?.toISOString() ?? null,
    fotoUrl: conductor.fotoUrl ?? null,
  };
}

function queueRanking(conductores: ConductorCandidatoInput[]) {
  const sorted = [...conductores].sort((a, b) => {
    const aDate = asDate(a.tiempoEnColaDesde);
    const bDate = asDate(b.tiempoEnColaDesde);
    const aTime = aDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = bDate?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime || a.nombre.localeCompare(b.nombre, 'es');
  });

  return new Map(sorted.map((conductor, index) => [conductor.id, index + 1]));
}

function razonCorta({
  conductor,
  factores,
  reserva,
  vehiculo,
}: {
  conductor: ConductorCandidatoInput;
  factores: FactoresAsignacion;
  reserva: ReservaAsignacionInput;
  vehiculo: VehiculoCandidatoInput;
}) {
  const cola =
    factores.ordenCola === null
      ? 'sin cola registrada'
      : `${factores.ordenCola}° en cola (${factores.minutosEnCola ?? 0} min)`;
  const tipoViaje = reserva.tipoViaje.replaceAll('_', ' ');
  return `Sugerido por: ${cola}, unidad ${vehiculo.tipo} compatible para ${factores.pasajerosRequeridos} pax y ${factores.distanciaKm.toFixed(1)} km al punto. ${conductor.nombre} conserva buen historial (${conductor.rating.toFixed(2)}). Servicio: ${tipoViaje}.`;
}

export function puntuarCandidatos({
  reserva,
  conductores,
  vehiculos,
  now = new Date(),
  pesos: pesosOverride,
}: PuntuarCandidatosArgs): CandidatoAsignacion[] {
  const pesos = getPesosAsignacion(pesosOverride);
  const rankByDriver = queueRanking(conductores);
  const pasajeros = pasajerosRequeridos(reserva);
  const vehiclesById = new Map(vehiculos.map((vehicle) => [vehicle.id, vehicle]));
  const candidatos: CandidatoAsignacion[] = [];

  // El `colaScore` se normaliza por la espera MÁXIMA de la cola actual, no con un
  // tope fijo. Un tope `min(minutos/60, 1)` satura: dos conductores que esperan
  // 65 y 74 min empatan en 1.0 y el desempate lo gana un factor secundario
  // (match/distancia), recomendando al #2 en cola sobre el #1. Eso rompe la regla
  // "cola de conductores, no cercanía pura" (CLAUDE.md §4.2) en cuanto las esperas
  // superan 60 min (normal en aeropuerto). Normalizar por el máximo mantiene la
  // monotonía: el que más espera siempre obtiene el mayor `colaScore` (1.0).
  const minutosByDriver = new Map(
    conductores.map((conductor) => [conductor.id, minutesSince(conductor.tiempoEnColaDesde, now)]),
  );
  const maxMinutos = Math.max(
    0,
    ...[...minutosByDriver.values()].filter((value): value is number => value !== null),
  );

  for (const conductor of conductores) {
    const assignedVehicle = conductor.vehiculoId ? vehiclesById.get(conductor.vehiculoId) : undefined;
    const vehiclePool = assignedVehicle ? [assignedVehicle] : vehiculos;
    const minutos = minutosByDriver.get(conductor.id) ?? null;
    const ordenCola = minutos === null ? null : rankByDriver.get(conductor.id) ?? null;
    const colaScore = minutos === null || maxMinutos <= 0 ? 0 : minutos / maxMinutos;
    const distancia = distanciaKm(reserva, conductor);
    const distanciaScore = 1 / Math.max(distancia, 1);

    for (const vehiculo of vehiclePool) {
      const capacidadSuficiente = vehiculo.capacidad >= pasajeros;
      if (!capacidadSuficiente) continue;

      const matchScore = matchTipoServicio(
        reserva.tipoViaje,
        vehiculo.tipo,
        pasajeros,
        reserva.tipoVehiculoPreferido,
      );
      const score = Math.round(
        (pesos.cola * colaScore + pesos.distancia * distanciaScore + pesos.match * matchScore) * 100,
      );
      const factores: FactoresAsignacion = {
        ordenCola,
        minutosEnCola: minutos,
        colaScore,
        distanciaKm: Math.round(distancia * 10) / 10,
        distanciaScore: Math.round(distanciaScore * 1000) / 1000,
        matchScore,
        pasajerosRequeridos: pasajeros,
        capacidadUnidad: vehiculo.capacidad,
        capacidadSuficiente,
        pesos,
      };

      candidatos.push({
        conductor: conductorToSuggestion(conductor),
        vehiculo: vehicleToSuggestion(vehiculo),
        score,
        razon: razonCorta({ conductor, factores, reserva, vehiculo }),
        factores,
      });
    }
  }

  return candidatos.sort((a, b) => {
    const byScore = b.score - a.score;
    if (byScore !== 0) return byScore;
    const aRank = a.factores.ordenCola ?? Number.POSITIVE_INFINITY;
    const bRank = b.factores.ordenCola ?? Number.POSITIVE_INFINITY;
    return aRank - bRank || a.conductor.nombre.localeCompare(b.conductor.nombre, 'es');
  });
}
