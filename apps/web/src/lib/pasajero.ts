import {
  calcularRutaEstimada,
  withRutaFallback,
  type PuntoGeo,
  type RouteLineString,
  type RouteResult,
  type RutaFuente,
} from '@taxigreen/rutas';
import { EstadoAbordaje, EstadoReserva, EstadoViaje, Prisma, prisma } from '@taxigreen/database';
import { serializarPagoDemo, type PagoResumen } from '@taxigreen/pagos';
import { pagoPasajeroHumano, resumenComercialHumano } from '@taxigreen/shared';
import { requiereCounter } from '@/lib/conductor-asignacion';

const passengerSelect = {
  id: true,
  tenant_id: true,
  voucher_codigo: true,
  token_pasajero: true,
  estado: true,
  tipo_viaje: true,
  tipo_pago: true,
  perfil_pasajero: true,
  responsable_pago: true,
  convenio_validado_demo: true,
  requiere_factura: true,
  vehiculo_preferencia: true,
  pasajeros_cantidad: true,
  equipaje_nivel: true,
  estado_abordaje: true,
  counter_validado_en: true,
  cancelada_por: true,
  cancelada_motivo: true,
  pasajero_nombre: true,
  pasajero_telefono: true,
  pasajero_email: true,
  pasajero_dni: true,
  pasajero_ruc: true,
  solicitante_nombre: true,
  solicitante_contacto: true,
  hotel_nombre: true,
  empresa_nombre: true,
  origen_texto: true,
  origen_lat: true,
  origen_lng: true,
  destino_texto: true,
  destino_lat: true,
  destino_lng: true,
  punto_encuentro: true,
  vuelo_codigo: true,
  fecha_hora_servicio: true,
  cotizacion_monto: true,
  cotizacion_moneda: true,
  calificacion: true,
  conductor: {
    select: {
      id: true,
      rating: true,
      total_viajes: true,
      foto_url: true,
      usuario: {
        select: {
          nombre: true,
          telefono: true,
        },
      },
      vehiculo: {
        select: {
          id: true,
          placa: true,
          marca: true,
          modelo: true,
          tipo: true,
          capacidad: true,
          color: true,
          anio: true,
          foto_url: true,
        },
      },
      posiciones: {
        orderBy: { ts: 'desc' },
        take: 1,
        select: {
          lat: true,
          lng: true,
          velocidad: true,
          ts: true,
        },
      },
    },
  },
  viajes: {
    orderBy: { created_at: 'desc' },
    take: 1,
    select: {
      id: true,
      estado: true,
      inicio_en_camino: true,
      llegada_punto: true,
      pasajero_a_bordo: true,
      finalizado_en: true,
      updated_at: true,
    },
  },
  comprobantes: {
    orderBy: { created_at: 'desc' },
    take: 1,
    select: {
      tipo: true,
      serie: true,
      correlativo: true,
      monto: true,
      estado: true,
      created_at: true,
      updated_at: true,
    },
  },
  pago: {
    select: {
      tipo_pago: true,
      estado: true,
      monto: true,
      moneda: true,
    },
  },
  incidencias: {
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      id: true,
      tipologia: true,
      severidad: true,
      estado: true,
      descripcion: true,
      timeline: true,
      created_at: true,
      updated_at: true,
      closed_at: true,
    },
  },
} satisfies Prisma.reservasSelect;

type PassengerRecord = Prisma.reservasGetPayload<{ select: typeof passengerSelect }>;

export type PassengerPosition = {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  ts: string;
};

export type PassengerTripData = {
  token: string;
  realtimeChannel: string;
  reserva: {
    estado: string;
    voucherCodigo: string;
    tipoViaje: string;
    fechaHoraServicio: string;
    abordaje: {
      requiereMostrador: boolean;
      autorizado: boolean;
      counterValidadoEn: string | null;
    };
    cancelada: {
      por: string;
      motivo: string | null;
    } | null;
  };
  // F6: qué puede hacer el pasajero AHORA, calculado server-side (la UI nunca decide sola).
  acciones: {
    pago: 'pagar_app' | 'confirmar_efectivo' | null;
    cancelacion: 'libre' | 'con_aviso' | 'solicitud' | null;
  };
  pasajero: {
    nombre: string;
    telefono: string;
    email: string | null;
    dni: string | null;
    ruc: string | null;
  };
  solicitante: {
    nombre: string | null;
    contacto: string | null;
  };
  conductor: {
    id: string | null;
    nombre: string;
    telefono: string | null;
    rating: number | null;
    totalViajes: number | null;
    fotoUrl: string | null;
  };
  unidad: {
    placa: string;
    marca: string;
    modelo: string;
    tipo: string;
    capacidad: number;
    color: string | null;
    anio: number | null;
    fotoUrl: string | null;
  } | null;
  ruta: {
    origen: { texto: string; lat: number | null; lng: number | null };
    destino: { texto: string; lat: number | null; lng: number | null };
    puntoEncuentro: string | null;
    vueloCodigo: string | null;
  };
  viaje: {
    estado: string | null;
    inicioEnCamino: string | null;
    llegadaPunto: string | null;
    pasajeroABordo: string | null;
    finalizadoEn: string | null;
    updatedAt: string | null;
  };
  tracking: {
    posicion: PassengerPosition | null;
    etaMinutos: number;
    distanciaMetros: number | null;
    duracionSegundos: number | null;
    duracionSinTraficoSegundos: number | null;
    geometry: RouteLineString | null;
    fuente: RutaFuente;
  };
  comprobante: {
    disponible: boolean;
    tipo: string | null;
    etiqueta: string | null;
    estado: string | null;
    pdfUrl: string;
  };
  pago: PagoResumen | null;
  comercial: {
    perfilPasajero: string;
    responsablePago: string;
    convenioValidadoDemo: boolean;
    requiereFactura: boolean;
    vehiculoPreferencia: string | null;
    pasajerosCantidad: number | null;
    equipajeNivel: string | null;
    resumen: string;
    pagoPasajero: string;
  };
  calificacion: PassengerRating | null;
  incidencias: PassengerIncident[];
};

export type PassengerRating = {
  servicio: number;
  conductor: number;
  unidad: number;
  motivo?: string | null;
  comentario?: string | null;
  creadoEn?: string;
};

export type PassengerIncident = {
  id: string;
  tipologia: string;
  severidad: string;
  estado: string;
  descripcion: string;
  timeline: unknown[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  casoUrl: string;
};

function isoOrNull(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function moneyLabel(value: Prisma.Decimal | null | undefined) {
  return value ? `S/ ${value.toNumber().toFixed(2)}` : null;
}

function normalizeTimeline(value: Prisma.JsonValue): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeRating(value: Prisma.JsonValue | null): PassengerRating | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const servicio = record.servicio;
  const conductor = record.conductor;
  const unidad = record.unidad;
  if (typeof servicio !== 'number' || typeof conductor !== 'number' || typeof unidad !== 'number') {
    return null;
  }

  return {
    servicio,
    conductor,
    unidad,
    motivo: typeof record.motivo === 'string' ? record.motivo : null,
    comentario: typeof record.comentario === 'string' ? record.comentario : null,
    creadoEn: typeof record.creadoEn === 'string' ? record.creadoEn : undefined,
  };
}

function serializeComercial(reserva: Pick<
  PassengerRecord,
  | 'perfil_pasajero'
  | 'responsable_pago'
  | 'convenio_validado_demo'
  | 'requiere_factura'
  | 'vehiculo_preferencia'
  | 'pasajeros_cantidad'
  | 'equipaje_nivel'
  | 'empresa_nombre'
  | 'hotel_nombre'
  | 'tipo_pago'
>) {
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
    pagoPasajero: pagoPasajeroHumano(input),
  };
}

function isFinished(reserva: PassengerRecord) {
  const viaje = reserva.viajes[0];
  return reserva.estado === EstadoReserva.por_liquidar || viaje?.estado === EstadoViaje.finalizado;
}

// F6: CTA de pago — solo pasajero responsable, viaje terminado y pago por cobrar.
function accionPago(reserva: PassengerRecord): 'pagar_app' | 'confirmar_efectivo' | null {
  if (reserva.responsable_pago !== 'pasajero') return null;
  if (!isFinished(reserva)) return null;
  if (reserva.pago?.estado !== 'por_cobrar') return null;
  if (reserva.pago.tipo_pago === 'app_pago') return 'pagar_app';
  if (reserva.pago.tipo_pago === 'efectivo') return 'confirmar_efectivo';
  return null;
}

// F6: etapa de cancelación (espejo server del endpoint /cancelar; master §5.3).
function accionCancelacion(reserva: PassengerRecord): 'libre' | 'con_aviso' | 'solicitud' | null {
  if (reserva.estado === EstadoReserva.cancelada || isFinished(reserva)) return null;
  const viaje = reserva.viajes[0] ?? null;
  if (viaje?.estado === EstadoViaje.a_bordo) return null;
  if (viaje?.estado === EstadoViaje.en_camino || viaje?.estado === EstadoViaje.en_punto) {
    return 'solicitud';
  }
  if (reserva.conductor || viaje?.estado === EstadoViaje.asignado) return 'con_aviso';
  return 'libre';
}

// F6: si paga el pasajero, el comprobante existe recién después de capturar el pago.
function comprobanteDisponible(reserva: PassengerRecord) {
  if (!isFinished(reserva)) return false;
  if (reserva.responsable_pago !== 'pasajero') return true;
  return !reserva.pago || reserva.pago.estado === 'capturado';
}

function estimateEtaMinutos(reserva: PassengerRecord) {
  const viaje = reserva.viajes[0];
  if (!viaje || viaje.estado === EstadoViaje.asignado) return 9;
  if (viaje.estado === EstadoViaje.en_camino) return 7;
  if (viaje.estado === EstadoViaje.en_punto) return 0;
  if (viaje.estado === EstadoViaje.a_bordo) return 22;
  return 0;
}

function pointFrom(lat: number | null, lng: number | null) {
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null;
}

function metrosEntre(a: PuntoGeo, b: PuntoGeo) {
  return calcularRutaEstimada({ origen: a, destino: b }, { sinuosidad: 1, velocidadKmh: 28 }).distanciaMetros;
}

// Tramo a trazar SIEMPRE como ruta real por calles (nunca recta de 2 puntos).
// Devuelve dos puntos REALES y distintos para cada fase del viaje; Mapbox los
// convierte en una polilínea de cientos de vértices. Reglas:
//  - a_bordo: conductor (o aeropuerto) → destino (tramo en curso con pasajero).
//  - asignado/en_camino/en_punto con GPS lejos del recojo: conductor → recojo (aproximación).
//  - resto (finalizado, sin GPS, o ya en el punto): viaje completo aeropuerto → destino.
// Antes `finalizado`/`en_punto` devolvían null y el cliente caía a una recta. Ya no.
function routeLeg(reserva: PassengerRecord, posicion: PassengerPosition | null): { start: PuntoGeo; end: PuntoGeo } | null {
  const origen = pointFrom(reserva.origen_lat, reserva.origen_lng);
  const destino = pointFrom(reserva.destino_lat, reserva.destino_lng);
  const driver = posicion ? { lat: posicion.lat, lng: posicion.lng } : null;
  const estado = reserva.viajes[0]?.estado;

  if (estado === EstadoViaje.a_bordo && destino) {
    return { start: driver ?? origen ?? destino, end: destino };
  }

  const aproximando =
    estado === EstadoViaje.asignado || estado === EstadoViaje.en_camino || estado === EstadoViaje.en_punto || !estado;
  if (aproximando && driver && origen && metrosEntre(driver, origen) > 120) {
    return { start: driver, end: origen };
  }

  if (origen && destino) return { start: origen, end: destino };
  return null;
}

// Caché in-memory de geometría real. El link /p/[token] se refresca cada 10 s y
// además hace SSR; sin caché, cada lectura golpearía Mapbox Directions y el SSR
// pagaría hasta `timeoutMs` de latencia. Clave redondeada a ~11 m (4 decimales).
const TRACKING_CACHE_TTL_MS = 30_000;
const trackingCache = new Map<string, { expiresAt: number; value: RouteResult }>();

function trackingKey(origen: PuntoGeo, destino: PuntoGeo) {
  return `${origen.lat.toFixed(4)},${origen.lng.toFixed(4)}|${destino.lat.toFixed(4)},${destino.lng.toFixed(4)}`;
}

// Ruta real (Mapbox driving-traffic) con fallback determinista, vía withRutaFallback.
// Antes esto llamaba directo a calcularRutaEstimada → geometría de 2 puntos (línea
// recta), y el cliente la repintaba sobre la curva de Mapbox en cada refresh. Ahora
// el server ya entrega la geometría real (705 puntos) desde el primer paint.
async function resolveRoute(origen: PuntoGeo, destino: PuntoGeo): Promise<RouteResult> {
  const key = trackingKey(origen, destino);
  const cached = trackingCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: RouteResult;
  try {
    value = await withRutaFallback({
      request: { origen, destino, perfil: 'driving-traffic' },
      timeoutMs: 2500,
    });
  } catch {
    value = calcularRutaEstimada({ origen, destino });
  }

  trackingCache.set(key, { expiresAt: Date.now() + TRACKING_CACHE_TTL_MS, value });
  return value;
}

async function computeTracking(reserva: PassengerRecord, posicion: PassengerPosition | null) {
  const leg = routeLeg(reserva, posicion);
  if (!leg) {
    // Sólo cuando la reserva no tiene coordenadas usables. Sin geometría: el
    // cliente no dibuja ninguna línea (nunca una recta simulada).
    return {
      etaMinutos: estimateEtaMinutos(reserva),
      distanciaMetros: null,
      duracionSegundos: null,
      duracionSinTraficoSegundos: null,
      geometry: null as RouteLineString | null,
      fuente: 'estimacion' as RutaFuente,
    };
  }

  const route = await resolveRoute(leg.start, leg.end);
  // La geometría de la estimación determinista es una recta de 2 puntos: no la
  // entregamos como trazo (el cliente sólo dibuja geometría real >2 vértices).
  const geometryReal = route.fuente === 'mapbox' && route.geometry.coordinates.length > 2 ? route.geometry : null;
  return {
    etaMinutos: Math.max(0, Math.ceil(route.duracionSegundos / 60)),
    distanciaMetros: route.distanciaMetros,
    duracionSegundos: route.duracionSegundos,
    duracionSinTraficoSegundos: route.duracionSinTraficoSegundos,
    geometry: geometryReal as RouteLineString | null,
    fuente: route.fuente,
  };
}

export async function serializePassengerTrip(reserva: PassengerRecord): Promise<PassengerTripData> {
  const viaje = reserva.viajes[0] ?? null;
  const comprobante = reserva.comprobantes[0] ?? null;
  const posicion = reserva.conductor?.posiciones[0] ?? null;
  const unidad = reserva.conductor?.vehiculo ?? null;
  const token = reserva.token_pasajero;
  const requiereMostrador = requiereCounter(reserva.tipo_viaje);

  const driverPosition = posicion
    ? {
        lat: posicion.lat,
        lng: posicion.lng,
        heading: null,
        speed: posicion.velocidad ?? null,
        ts: posicion.ts.toISOString(),
      }
    : null;
  const tracking = await computeTracking(reserva, driverPosition);

  return {
    token,
    realtimeChannel: `reserva-${reserva.id}`,
    reserva: {
      estado: reserva.estado,
      voucherCodigo: reserva.voucher_codigo,
      tipoViaje: reserva.tipo_viaje,
      fechaHoraServicio: reserva.fecha_hora_servicio.toISOString(),
      abordaje: {
        requiereMostrador,
        autorizado: !requiereMostrador || reserva.estado_abordaje === EstadoAbordaje.autorizado,
        counterValidadoEn: isoOrNull(reserva.counter_validado_en),
      },
      cancelada:
        reserva.estado === EstadoReserva.cancelada
          ? { por: reserva.cancelada_por ?? 'equipo', motivo: reserva.cancelada_motivo }
          : null,
    },
    acciones: {
      pago: accionPago(reserva),
      cancelacion: accionCancelacion(reserva),
    },
    pasajero: {
      nombre: reserva.pasajero_nombre,
      telefono: reserva.pasajero_telefono,
      email: reserva.pasajero_email,
      dni: reserva.pasajero_dni,
      ruc: reserva.pasajero_ruc,
    },
    solicitante: {
      nombre: reserva.solicitante_nombre ?? reserva.hotel_nombre ?? reserva.empresa_nombre,
      contacto: reserva.solicitante_contacto,
    },
    conductor: {
      id: reserva.conductor?.id ?? null,
      nombre: reserva.conductor?.usuario.nombre ?? 'Conductor asignado',
      telefono: reserva.conductor?.usuario.telefono ?? null,
      rating: reserva.conductor?.rating ?? null,
      totalViajes: reserva.conductor?.total_viajes ?? null,
      fotoUrl: reserva.conductor?.foto_url ?? null,
    },
    unidad: unidad
      ? {
          placa: unidad.placa,
          marca: unidad.marca,
          modelo: unidad.modelo,
          tipo: unidad.tipo,
          capacidad: unidad.capacidad,
          color: unidad.color,
          anio: unidad.anio,
          fotoUrl: unidad.foto_url,
        }
      : null,
    ruta: {
      origen: {
        texto: reserva.origen_texto,
        lat: reserva.origen_lat,
        lng: reserva.origen_lng,
      },
      destino: {
        texto: reserva.destino_texto,
        lat: reserva.destino_lat,
        lng: reserva.destino_lng,
      },
      puntoEncuentro: reserva.punto_encuentro,
      vueloCodigo: reserva.vuelo_codigo,
    },
    viaje: {
      estado: viaje?.estado ?? null,
      inicioEnCamino: isoOrNull(viaje?.inicio_en_camino),
      llegadaPunto: isoOrNull(viaje?.llegada_punto),
      pasajeroABordo: isoOrNull(viaje?.pasajero_a_bordo),
      finalizadoEn: isoOrNull(viaje?.finalizado_en),
      updatedAt: isoOrNull(viaje?.updated_at),
    },
    tracking: {
      posicion: driverPosition,
      etaMinutos: tracking.etaMinutos,
      distanciaMetros: tracking.distanciaMetros,
      duracionSegundos: tracking.duracionSegundos,
      duracionSinTraficoSegundos: tracking.duracionSinTraficoSegundos,
      geometry: tracking.geometry,
      fuente: tracking.fuente,
    },
    comprobante: {
      disponible: comprobanteDisponible(reserva),
      tipo: comprobante?.tipo ?? null,
      etiqueta: comprobante
        ? `${comprobante.tipo.toUpperCase()} ${comprobante.serie}-${String(comprobante.correlativo).padStart(6, '0')} · ${moneyLabel(comprobante.monto)}`
        : null,
      estado: comprobante?.estado ?? null,
      pdfUrl: `/api/pasajero/${token}/comprobante/pdf`,
    },
    pago: serializarPagoDemo({
      tipoPago: reserva.tipo_pago,
      pago: reserva.pago,
      cotizacionMonto: reserva.cotizacion_monto,
      cotizacionMoneda: reserva.cotizacion_moneda,
    }),
    comercial: serializeComercial(reserva),
    calificacion: normalizeRating(reserva.calificacion),
    incidencias: reserva.incidencias.map((incidencia) => ({
      id: incidencia.id,
      tipologia: incidencia.tipologia,
      severidad: incidencia.severidad,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion,
      timeline: normalizeTimeline(incidencia.timeline),
      createdAt: incidencia.created_at.toISOString(),
      updatedAt: incidencia.updated_at.toISOString(),
      closedAt: isoOrNull(incidencia.closed_at),
      casoUrl: `/bienestar/${incidencia.id}?t=${token}`,
    })),
  };
}

export async function getPassengerTripByToken(token: string) {
  const reserva = await prisma.reservas.findFirst({
    where: {
      token_pasajero: token,
      deleted_at: null,
    },
    select: passengerSelect,
  });

  return reserva ? await serializePassengerTrip(reserva) : null;
}
