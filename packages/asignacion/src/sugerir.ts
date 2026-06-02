import {
  EstadoViaje,
  prisma,
  type Prisma,
} from '@taxigreen/database';
import { puntuarCandidatos } from './heuristica';
import type {
  ConductorCandidatoInput,
  ReservaAsignacionInput,
  SugerenciaAsignacion,
  VehiculoCandidatoInput,
} from './types';

const ACTIVE_TRIP_STATES = [
  EstadoViaje.asignado,
  EstadoViaje.en_camino,
  EstadoViaje.en_punto,
  EstadoViaje.a_bordo,
] as const;

const reservaSelect = {
  id: true,
  tenant_id: true,
  voucher_codigo: true,
  tipo_viaje: true,
  origen_texto: true,
  origen_lat: true,
  origen_lng: true,
  destino_texto: true,
  fecha_hora_servicio: true,
  raw_ingesta: true,
} satisfies Prisma.reservasSelect;

type ReservaRecord = Prisma.reservasGetPayload<{ select: typeof reservaSelect }>;

export interface SugerirAsignacionDeterministaOptions {
  tenantId?: string;
  now?: Date;
}

function jsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractPasajeros(raw: Prisma.JsonValue | null) {
  const root = jsonObject(raw);
  const resultado = jsonObject(root?.resultado as Prisma.JsonValue | null);
  const reserva = jsonObject(resultado?.reserva as Prisma.JsonValue | null);
  const value = reserva?.pasajeros ?? root?.pasajeros;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapReserva(reserva: ReservaRecord): ReservaAsignacionInput {
  return {
    id: reserva.id,
    tenantId: reserva.tenant_id,
    voucherCodigo: reserva.voucher_codigo,
    tipoViaje: reserva.tipo_viaje as ReservaAsignacionInput['tipoViaje'],
    origenTexto: reserva.origen_texto,
    origenLat: reserva.origen_lat,
    origenLng: reserva.origen_lng,
    destinoTexto: reserva.destino_texto,
    fechaHoraServicio: reserva.fecha_hora_servicio,
    pasajeros: extractPasajeros(reserva.raw_ingesta),
  };
}

export async function sugerirAsignacionDeterminista(
  reservaId: string,
  options: SugerirAsignacionDeterministaOptions = {},
): Promise<SugerenciaAsignacion | null> {
  const reserva = await prisma.reservas.findFirst({
    where: {
      id: reservaId,
      tenant_id: options.tenantId,
      deleted_at: null,
    },
    select: reservaSelect,
  });
  if (!reserva) return null;

  const [conductoresRaw, vehiculosRaw] = await Promise.all([
    prisma.conductores.findMany({
      where: {
        tenant_id: reserva.tenant_id,
        usuario: {
          activo: true,
          deleted_at: null,
        },
        viajes: {
          none: {
            reserva_id: { not: reserva.id },
            estado: { in: [...ACTIVE_TRIP_STATES] },
            deleted_at: null,
          },
        },
      },
      select: {
        id: true,
        rating: true,
        total_viajes: true,
        tiempo_en_cola_desde: true,
        vehiculo_id: true,
        foto_url: true,
        usuario: {
          select: {
            nombre: true,
          },
        },
        posiciones: {
          orderBy: { ts: 'desc' },
          take: 1,
          select: {
            lat: true,
            lng: true,
          },
        },
      },
    }),
    prisma.vehiculos.findMany({
      where: { tenant_id: reserva.tenant_id },
      select: {
        id: true,
        placa: true,
        marca: true,
        modelo: true,
        tipo: true,
        capacidad: true,
        color: true,
        anio: true,
      },
    }),
  ]);

  const conductores: ConductorCandidatoInput[] = conductoresRaw.map((conductor) => {
    const posicion = conductor.posiciones[0];
    return {
      id: conductor.id,
      nombre: conductor.usuario.nombre,
      rating: conductor.rating,
      totalViajes: conductor.total_viajes,
      tiempoEnColaDesde: conductor.tiempo_en_cola_desde,
      vehiculoId: conductor.vehiculo_id,
      fotoUrl: conductor.foto_url,
      lat: posicion?.lat,
      lng: posicion?.lng,
    };
  });

  const vehiculos: VehiculoCandidatoInput[] = vehiculosRaw.map((vehiculo) => ({
    id: vehiculo.id,
    placa: vehiculo.placa,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    tipo: vehiculo.tipo as VehiculoCandidatoInput['tipo'],
    capacidad: vehiculo.capacidad,
    color: vehiculo.color,
    anio: vehiculo.anio,
  }));

  const candidatos = puntuarCandidatos({
    reserva: mapReserva(reserva),
    conductores,
    vehiculos,
    now: options.now,
  });
  const top = candidatos[0];
  if (!top) return null;

  return {
    reservaId: reserva.id,
    tenantId: reserva.tenant_id,
    contexto: {
      voucherCodigo: reserva.voucher_codigo,
      tipoViaje: reserva.tipo_viaje as ReservaAsignacionInput['tipoViaje'],
      origenTexto: reserva.origen_texto,
      destinoTexto: reserva.destino_texto,
    },
    conductor: top.conductor,
    vehiculo: top.vehiculo,
    razon: top.razon,
    score: top.score,
    factores: top.factores,
    fuente: 'algoritmo',
    motivo: 'heuristica_determinista',
    modelo: null,
    candidatos: candidatos.slice(0, 3),
    generadoEn: new Date().toISOString(),
  };
}
