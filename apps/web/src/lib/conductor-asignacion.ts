import {
  EstadoAbordaje,
  EstadoReserva,
  EstadoViaje,
  Prisma,
  TipoViaje,
  type TipoVehiculo,
} from '@taxigreen/database';
import { serializarPagoDemo, type PagoResumen } from '@taxigreen/pagos';
import { pagoConductorHumano, resumenComercialHumano } from '@taxigreen/shared';

export const estadosViajeSecuencia = [
  EstadoViaje.asignado,
  EstadoViaje.en_camino,
  EstadoViaje.en_punto,
  EstadoViaje.a_bordo,
  EstadoViaje.finalizado,
] as const;

export type EstadoViajeSecuencial = (typeof estadosViajeSecuencia)[number];

export function siguienteEstadoViaje(estado: EstadoViaje): EstadoViajeSecuencial | null {
  const index = estadosViajeSecuencia.indexOf(estado as EstadoViajeSecuencial);
  return index >= 0 ? estadosViajeSecuencia[index + 1] ?? null : null;
}

export function validarTransicionViaje(actual: EstadoViaje, nuevo: EstadoViaje) {
  const esperado = siguienteEstadoViaje(actual);
  if (!esperado || nuevo !== esperado) {
    return { ok: false as const, esperado };
  }

  return { ok: true as const, esperado };
}

export function requiereCounter(tipoViaje: TipoViaje | string): boolean {
  return tipoViaje === TipoViaje.recojo_aeropuerto;
}

export function estadoAbordajeInicial(tipoViaje: TipoViaje | string): EstadoAbordaje {
  return requiereCounter(tipoViaje) ? EstadoAbordaje.pendiente_validacion : EstadoAbordaje.no_requerido;
}

export function puedeIniciarRuta(args: {
  tipoViaje: TipoViaje | string;
  estadoAbordaje: EstadoAbordaje | string;
}): { ok: true } | { ok: false; motivo: 'counter_pendiente' } {
  if (!requiereCounter(args.tipoViaje)) return { ok: true };
  if (args.estadoAbordaje === EstadoAbordaje.autorizado) return { ok: true };
  return { ok: false, motivo: 'counter_pendiente' };
}

export function estadoReservaParaViaje(estadoViaje: EstadoViaje) {
  if (
    estadoViaje === EstadoViaje.en_camino ||
    estadoViaje === EstadoViaje.en_punto ||
    estadoViaje === EstadoViaje.a_bordo
  ) {
    return EstadoReserva.en_curso;
  }

  if (estadoViaje === EstadoViaje.finalizado) {
    return EstadoReserva.por_liquidar;
  }

  return EstadoReserva.asignada;
}

export function timestampFieldForEstado(estadoViaje: EstadoViaje) {
  if (estadoViaje === EstadoViaje.en_camino) return 'inicio_en_camino';
  if (estadoViaje === EstadoViaje.en_punto) return 'llegada_punto';
  if (estadoViaje === EstadoViaje.a_bordo) return 'pasajero_a_bordo';
  if (estadoViaje === EstadoViaje.finalizado) return 'finalizado_en';
  return null;
}

export type ConductorAsignacionResponse = {
  id: string;
  voucherCodigo: string;
  tipoViaje: string;
  fechaHoraServicio: string;
  estadoReserva: string;
  cobro: PagoResumen | null;
  comercial: {
    perfilPasajero: string;
    responsablePago: string;
    convenioValidadoDemo: boolean;
    requiereFactura: boolean;
    vehiculoPreferencia: string | null;
    pasajerosCantidad: number | null;
    equipajeNivel: string | null;
    resumen: string;
    pagoConductor: string;
  };
  pasajero: {
    nombre: string;
    telefono: string;
    email: string | null;
    dni: string | null;
  };
  vuelo: {
    codigo: string | null;
  };
  origen: {
    texto: string;
    lat: number | null;
    lng: number | null;
  };
  puntoEncuentro: string | null;
  destino: {
    texto: string;
    lat: number | null;
    lng: number | null;
  };
  voucher: {
    codigo: string;
    emitidoEn: string | null;
    tokenPasajero: string;
  };
  abordaje: {
    requiereCounter: boolean;
    autorizado: boolean;
    counterValidadoEn: string | null;
  };
  viaje: {
    id: string;
    estado: string;
    inicioEnCamino: string | null;
    llegadaPunto: string | null;
    pasajeroABordo: string | null;
    finalizadoEn: string | null;
    updatedAt: string;
  } | null;
  conductor: {
    id: string;
    nombre: string;
    telefono: string | null;
    rating: number;
    totalViajes: number;
  };
  unidad: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    tipo: TipoVehiculo;
    capacidad: number;
    color: string | null;
    anio: number | null;
  } | null;
};

type SerializableReserva = {
  id: string;
  voucher_codigo: string;
  tipo_viaje: string;
  tipo_pago: string;
  perfil_pasajero: string;
  responsable_pago: string;
  convenio_validado_demo: boolean;
  requiere_factura: boolean;
  vehiculo_preferencia: string | null;
  pasajeros_cantidad: number | null;
  equipaje_nivel: string | null;
  empresa_nombre: string | null;
  hotel_nombre: string | null;
  fecha_hora_servicio: Date;
  estado: string;
  pasajero_nombre: string;
  pasajero_telefono: string;
  pasajero_email: string | null;
  pasajero_dni: string | null;
  vuelo_codigo: string | null;
  origen_texto: string;
  origen_lat: number | null;
  origen_lng: number | null;
  punto_encuentro: string | null;
  destino_texto: string;
  destino_lat: number | null;
  destino_lng: number | null;
  voucher_emitido_en: Date | null;
  token_pasajero: string;
  estado_abordaje: EstadoAbordaje | string;
  counter_validado_en: Date | null;
  cotizacion_monto: Prisma.Decimal | null;
  cotizacion_moneda: string | null;
  pago: {
    tipo_pago: string;
    estado: string;
    monto: Prisma.Decimal;
    moneda: string;
  } | null;
  conductor: {
    id: string;
    rating: number;
    total_viajes: number;
    usuario: {
      nombre: string;
      telefono: string | null;
    };
    vehiculo: {
      id: string;
      placa: string;
      marca: string;
      modelo: string;
      tipo: TipoVehiculo;
      capacidad: number;
      color: string | null;
      anio: number | null;
    } | null;
  } | null;
  viajes: Array<{
    id: string;
    estado: string;
    inicio_en_camino: Date | null;
    llegada_punto: Date | null;
    pasajero_a_bordo: Date | null;
    finalizado_en: Date | null;
    updated_at: Date;
  }>;
};

function isoOrNull(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function serializeComercial(reserva: SerializableReserva) {
  const input = {
    perfilPasajero: reserva.perfil_pasajero,
    responsablePago: reserva.responsable_pago,
    convenioValidadoDemo: reserva.convenio_validado_demo,
    requiereFactura: reserva.requiere_factura,
    empresaNombre: reserva.empresa_nombre,
    hotelNombre: reserva.hotel_nombre,
    tipoPago: reserva.tipo_pago,
  };
  return {
    perfilPasajero: reserva.perfil_pasajero,
    responsablePago: reserva.responsable_pago,
    convenioValidadoDemo: reserva.convenio_validado_demo,
    requiereFactura: reserva.requiere_factura,
    vehiculoPreferencia: reserva.vehiculo_preferencia,
    pasajerosCantidad: reserva.pasajeros_cantidad,
    equipajeNivel: reserva.equipaje_nivel,
    resumen: resumenComercialHumano(input),
    pagoConductor: pagoConductorHumano(input),
  };
}

export function serializeConductorAsignacion(
  reserva: SerializableReserva,
): ConductorAsignacionResponse {
  const viaje = reserva.viajes[0] ?? null;
  const counterRequerido = requiereCounter(reserva.tipo_viaje);

  return {
    id: reserva.id,
    voucherCodigo: reserva.voucher_codigo,
    tipoViaje: reserva.tipo_viaje,
    fechaHoraServicio: reserva.fecha_hora_servicio.toISOString(),
    estadoReserva: reserva.estado,
    cobro: serializarPagoDemo({
      tipoPago: reserva.tipo_pago,
      pago: reserva.pago,
      cotizacionMonto: reserva.cotizacion_monto,
      cotizacionMoneda: reserva.cotizacion_moneda,
    }),
    comercial: serializeComercial(reserva),
    pasajero: {
      nombre: reserva.pasajero_nombre,
      telefono: reserva.pasajero_telefono,
      email: reserva.pasajero_email,
      dni: reserva.pasajero_dni,
    },
    vuelo: {
      codigo: reserva.vuelo_codigo,
    },
    origen: {
      texto: reserva.origen_texto,
      lat: reserva.origen_lat,
      lng: reserva.origen_lng,
    },
    puntoEncuentro: reserva.punto_encuentro,
    destino: {
      texto: reserva.destino_texto,
      lat: reserva.destino_lat,
      lng: reserva.destino_lng,
    },
    voucher: {
      codigo: reserva.voucher_codigo,
      emitidoEn: isoOrNull(reserva.voucher_emitido_en),
      tokenPasajero: reserva.token_pasajero,
    },
    abordaje: {
      requiereCounter: counterRequerido,
      autorizado: !counterRequerido || reserva.estado_abordaje === EstadoAbordaje.autorizado,
      counterValidadoEn: isoOrNull(reserva.counter_validado_en),
    },
    viaje: viaje
      ? {
          id: viaje.id,
          estado: viaje.estado,
          inicioEnCamino: isoOrNull(viaje.inicio_en_camino),
          llegadaPunto: isoOrNull(viaje.llegada_punto),
          pasajeroABordo: isoOrNull(viaje.pasajero_a_bordo),
          finalizadoEn: isoOrNull(viaje.finalizado_en),
          updatedAt: viaje.updated_at.toISOString(),
        }
      : null,
    conductor: {
      id: reserva.conductor?.id ?? '',
      nombre: reserva.conductor?.usuario.nombre ?? 'Conductor asignado',
      telefono: reserva.conductor?.usuario.telefono ?? null,
      rating: reserva.conductor?.rating ?? 0,
      totalViajes: reserva.conductor?.total_viajes ?? 0,
    },
    unidad: reserva.conductor?.vehiculo ?? null,
  };
}

export type ConductorViajeResumen = {
  id: string;
  tipoViaje: string;
  fechaHoraServicio: string;
  estadoReserva: string;
  estadoViaje: string | null;
  finalizadoEn: string | null;
  activo: boolean;
  pasajeroNombre: string;
  origenTexto: string;
  destinoTexto: string;
  vueloCodigo: string | null;
  unidadEtiqueta: string | null;
};

type SerializableResumen = {
  id: string;
  tipo_viaje: string;
  fecha_hora_servicio: Date;
  estado: string;
  pasajero_nombre: string;
  origen_texto: string;
  destino_texto: string;
  vuelo_codigo: string | null;
  conductor: { vehiculo: { placa: string; marca: string; modelo: string } | null } | null;
  viajes: Array<{ estado: string; finalizado_en: Date | null; updated_at: Date }>;
};

const estadosReservaCerrados = new Set<string>([
  EstadoReserva.finalizada,
  EstadoReserva.por_liquidar,
  EstadoReserva.cancelada,
]);

// Un viaje está "activo" mientras no esté finalizado/cancelado: la app lo muestra
// destacado y arriba; los cerrados van al historial para revisar detalles.
export function serializeConductorViajeResumen(reserva: SerializableResumen): ConductorViajeResumen {
  const viaje = reserva.viajes[0] ?? null;
  const estadoViaje = viaje?.estado ?? null;
  const cerradoPorViaje = estadoViaje === EstadoViaje.finalizado;
  const cerradoPorReserva = estadosReservaCerrados.has(reserva.estado);
  const activo = !cerradoPorViaje && !cerradoPorReserva;
  const vehiculo = reserva.conductor?.vehiculo ?? null;

  return {
    id: reserva.id,
    tipoViaje: reserva.tipo_viaje,
    fechaHoraServicio: reserva.fecha_hora_servicio.toISOString(),
    estadoReserva: reserva.estado,
    estadoViaje,
    finalizadoEn: isoOrNull(viaje?.finalizado_en),
    activo,
    pasajeroNombre: reserva.pasajero_nombre,
    origenTexto: reserva.origen_texto,
    destinoTexto: reserva.destino_texto,
    vueloCodigo: reserva.vuelo_codigo,
    unidadEtiqueta: vehiculo ? `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}` : null,
  };
}
