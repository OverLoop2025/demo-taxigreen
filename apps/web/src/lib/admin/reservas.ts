import {
  EstadoReserva,
  EstadoViaje,
  Prisma,
  prisma,
  type TipoVehiculo,
} from '@taxigreen/database';
import { serializarPagoDemo, type PagoResumen } from '@taxigreen/pagos';
import { pagoMostradorHumano, resumenComercialHumano } from '@taxigreen/shared';
import { requiereCounter } from '@/lib/conductor-asignacion';

const ACTIVE_TRIP_STATES = [
  EstadoViaje.asignado,
  EstadoViaje.en_camino,
  EstadoViaje.en_punto,
  EstadoViaje.a_bordo,
] as const;

const reservaListSelect = {
  id: true,
  tenant_id: true,
  voucher_codigo: true,
  estado: true,
  token_pasajero: true,
  canal_origen: true,
  tipo_viaje: true,
  tipo_pago: true,
  perfil_pasajero: true,
  responsable_pago: true,
  convenio_validado_demo: true,
  requiere_factura: true,
  vehiculo_preferencia: true,
  pasajeros_cantidad: true,
  equipaje_nivel: true,
  empresa_nombre: true,
  hotel_nombre: true,
  pasajero_nombre: true,
  pasajero_telefono: true,
  origen_texto: true,
  destino_texto: true,
  punto_encuentro: true,
  vuelo_codigo: true,
  fecha_hora_servicio: true,
  voucher_emitido_en: true,
  estado_abordaje: true,
  counter_validado_en: true,
  cotizacion_monto: true,
  cotizacion_moneda: true,
  conductor_id: true,
  cancelada_por: true,
  cancelada_motivo: true,
  updated_at: true,
  created_at: true,
  viajes: {
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 1,
    select: { estado: true },
  },
  conductor: {
    select: {
      id: true,
      rating: true,
      total_viajes: true,
      tiempo_en_cola_desde: true,
      usuario: {
        select: {
          nombre: true,
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
        },
      },
    },
  },
  comprobantes: {
    orderBy: {
      created_at: 'desc',
    },
    take: 1,
    select: {
      tipo: true,
      serie: true,
      correlativo: true,
      monto: true,
      estado: true,
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
} satisfies Prisma.reservasSelect;

type ReservaListRecord = Prisma.reservasGetPayload<{ select: typeof reservaListSelect }>;

export type AdminReservaRow = {
  id: string;
  tenantId: string;
  voucherCodigo: string;
  estado: string;
  tokenPasajero: string;
  canalOrigen: string;
  tipoViaje: string;
  tipoPago: string;
  pasajeroNombre: string;
  pasajeroTelefono: string;
  origenTexto: string;
  destinoTexto: string;
  puntoEncuentro: string | null;
  vueloCodigo: string | null;
  fechaHoraServicio: string;
  fechaHoraServicioLabel: string;
  voucherEmitido: boolean;
  conductorId: string | null;
  conductorNombre: string | null;
  conductorRating: number | null;
  conductorViajes: number | null;
  vehiculoId: string | null;
  vehiculoLabel: string | null;
  rutaResumen: string;
  comprobanteLabel: string | null;
  comprobante: {
    label: string;
    estado: string;
    montoEtiqueta: string;
  } | null;
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
    pagoMostrador: string;
  };
  abordaje: {
    estado: string;
    requiereMostrador: boolean;
    autorizado: boolean;
    counterValidadoEn: string | null;
  };
  // F7: el conductor canceló y la reserva quedó esperando otra unidad.
  necesitaNuevaUnidad: boolean;
  // F6: cancelación efectiva (quién y por qué) para mostrarla sin tecnicismos.
  cancelada: { por: string; motivo: string | null } | null;
  updatedAt: string;
};

export type AdminConductorOption = {
  id: string;
  nombre: string;
  rating: number;
  totalViajes: number;
  tiempoEnColaDesde: string | null;
  minutosEnCola: number | null;
  vehiculoActual: string | null;
};

export type AdminVehiculoOption = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculo;
  capacidad: number;
  color: string | null;
  anio: number | null;
};

export type AdminAuditRow = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  payload: string;
};

export type AdminReservaDetalle = AdminReservaRow & {
  solicitanteTipo: string | null;
  solicitanteNombre: string | null;
  solicitanteContacto: string | null;
  pasajeroEmail: string | null;
  pasajeroDni: string | null;
  pasajeroRuc: string | null;
  hotelNombre: string | null;
  empresaNombre: string | null;
  tipoPago: string;
  rawIngesta: string | null;
  sugerenciaCopiloto: string | null;
  viajes: Array<{
    id: string;
    estado: string;
    createdAt: string;
    updatedAt: string;
  }>;
  incidencias: Array<{
    id: string;
    tipologia: string;
    severidad: string;
    estado: string;
    descripcion: string;
  }>;
  auditoria: AdminAuditRow[];
};

function dateLabel(date: Date) {
  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutesSince(value: Date | null) {
  if (!value) return null;
  return Math.max(0, Math.round((Date.now() - value.getTime()) / 60_000));
}

type ReservaVehicle = NonNullable<ReservaListRecord['conductor']>['vehiculo'];

function vehicleLabel(vehicle: ReservaVehicle | null | undefined) {
  if (!vehicle) return null;
  return `${vehicle.placa} · ${vehicle.marca} ${vehicle.modelo}`;
}

function moneyLabel(value: Prisma.Decimal) {
  return `S/ ${value.toNumber().toFixed(2)}`;
}

function serializeComercial(reserva: Pick<
  ReservaListRecord,
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
    pagoMostrador: pagoMostradorHumano(input),
  };
}

export function serializeReservaRow(reserva: ReservaListRecord): AdminReservaRow {
  const comprobante = reserva.comprobantes[0];
  const comprobanteLabel = comprobante
    ? `${comprobante.tipo.toUpperCase()} ${comprobante.serie}-${String(comprobante.correlativo).padStart(6, '0')}`
    : null;
  const requiereMostrador = requiereCounter(reserva.tipo_viaje);

  return {
    id: reserva.id,
    tenantId: reserva.tenant_id,
    voucherCodigo: reserva.voucher_codigo,
    estado: reserva.estado,
    tokenPasajero: reserva.token_pasajero,
    canalOrigen: reserva.canal_origen,
    tipoViaje: reserva.tipo_viaje,
    tipoPago: reserva.tipo_pago,
    pasajeroNombre: reserva.pasajero_nombre,
    pasajeroTelefono: reserva.pasajero_telefono,
    origenTexto: reserva.origen_texto,
    destinoTexto: reserva.destino_texto,
    puntoEncuentro: reserva.punto_encuentro,
    vueloCodigo: reserva.vuelo_codigo,
    fechaHoraServicio: reserva.fecha_hora_servicio.toISOString(),
    fechaHoraServicioLabel: dateLabel(reserva.fecha_hora_servicio),
    voucherEmitido: Boolean(reserva.voucher_emitido_en),
    conductorId: reserva.conductor_id,
    conductorNombre: reserva.conductor?.usuario.nombre ?? null,
    conductorRating: reserva.conductor?.rating ?? null,
    conductorViajes: reserva.conductor?.total_viajes ?? null,
    vehiculoId: reserva.conductor?.vehiculo?.id ?? null,
    vehiculoLabel: vehicleLabel(reserva.conductor?.vehiculo),
    rutaResumen: `${reserva.origen_texto} -> ${reserva.destino_texto}`,
    comprobanteLabel,
    comprobante: comprobante
      ? {
          label: comprobanteLabel!,
          estado: comprobante.estado,
          montoEtiqueta: moneyLabel(comprobante.monto),
        }
      : null,
    pago: serializarPagoDemo({
      tipoPago: reserva.tipo_pago,
      pago: reserva.pago,
      cotizacionMonto: reserva.cotizacion_monto,
      cotizacionMoneda: reserva.cotizacion_moneda,
    }),
    comercial: serializeComercial(reserva),
    abordaje: {
      estado: reserva.estado_abordaje,
      requiereMostrador,
      autorizado: !requiereMostrador || reserva.estado_abordaje === 'autorizado',
      counterValidadoEn: reserva.counter_validado_en?.toISOString() ?? null,
    },
    necesitaNuevaUnidad:
      reserva.estado === 'confirmada' &&
      !reserva.conductor_id &&
      reserva.viajes[0]?.estado === 'cancelado',
    cancelada:
      reserva.estado === 'cancelada'
        ? { por: reserva.cancelada_por ?? 'equipo', motivo: reserva.cancelada_motivo }
        : null,
    updatedAt: reserva.updated_at.toISOString(),
  };
}

export async function getAdminReservas(tenantId: string) {
  const reservas = await prisma.reservas.findMany({
    where: {
      tenant_id: tenantId,
      deleted_at: null,
    },
    orderBy: [{ fecha_hora_servicio: 'asc' }, { created_at: 'desc' }],
    take: 60,
    select: reservaListSelect,
  });

  return reservas.map(serializeReservaRow);
}

export async function getReservaDetalle(tenantId: string, reservaId: string) {
  const reserva = await prisma.reservas.findFirst({
    where: {
      id: reservaId,
      tenant_id: tenantId,
      deleted_at: null,
    },
    select: {
      ...reservaListSelect,
      solicitante_tipo: true,
      solicitante_nombre: true,
      solicitante_contacto: true,
      pasajero_email: true,
      pasajero_dni: true,
      pasajero_ruc: true,
      hotel_nombre: true,
      empresa_nombre: true,
      tipo_pago: true,
      raw_ingesta: true,
      sugerencia_copiloto: true,
      viajes: {
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          estado: true,
          created_at: true,
          updated_at: true,
        },
      },
      incidencias: {
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          tipologia: true,
          severidad: true,
          estado: true,
          descripcion: true,
        },
      },
    },
  });

  if (!reserva) return null;

  const auditoria = await prisma.auditoria.findMany({
    where: {
      tenant_id: tenantId,
      target_table: 'reservas',
      target_id: reserva.id,
    },
    orderBy: { ts: 'desc' },
    take: 20,
  });

  return {
    ...serializeReservaRow(reserva),
    solicitanteTipo: reserva.solicitante_tipo,
    solicitanteNombre: reserva.solicitante_nombre,
    solicitanteContacto: reserva.solicitante_contacto,
    pasajeroEmail: reserva.pasajero_email,
    pasajeroDni: reserva.pasajero_dni,
    pasajeroRuc: reserva.pasajero_ruc,
    hotelNombre: reserva.hotel_nombre,
    empresaNombre: reserva.empresa_nombre,
    tipoPago: reserva.tipo_pago,
    rawIngesta: reserva.raw_ingesta ? JSON.stringify(reserva.raw_ingesta, null, 2) : null,
    sugerenciaCopiloto: reserva.sugerencia_copiloto
      ? JSON.stringify(reserva.sugerencia_copiloto, null, 2)
      : null,
    viajes: reserva.viajes.map((viaje) => ({
      id: viaje.id,
      estado: viaje.estado,
      createdAt: dateLabel(viaje.created_at),
      updatedAt: dateLabel(viaje.updated_at),
    })),
    incidencias: reserva.incidencias.map((incidencia) => ({
      id: incidencia.id,
      tipologia: incidencia.tipologia,
      severidad: incidencia.severidad,
      estado: incidencia.estado,
      descripcion: incidencia.descripcion,
    })),
    auditoria: auditoria.map((event) => ({
      id: event.id,
      ts: event.ts.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      actor: `${event.actor_tipo}${event.actor_id ? `:${event.actor_id}` : ''}`,
      action: event.action,
      payload: event.payload ? JSON.stringify(event.payload) : '{}',
    })),
  } satisfies AdminReservaDetalle;
}

export async function getConductoresActivos(tenantId: string, currentConductorId?: string | null) {
  const availabilityWhere = currentConductorId
    ? {
        OR: [
          { id: currentConductorId },
          {
            viajes: {
              none: {
                estado: { in: [...ACTIVE_TRIP_STATES] },
                deleted_at: null,
              },
            },
          },
        ],
      }
    : {
        viajes: {
          none: {
            estado: { in: [...ACTIVE_TRIP_STATES] },
            deleted_at: null,
          },
        },
      };

  const conductores = await prisma.conductores.findMany({
    where: {
      tenant_id: tenantId,
      usuario: {
        activo: true,
        deleted_at: null,
      },
      ...availabilityWhere,
    },
    include: {
      usuario: {
        select: {
          nombre: true,
        },
      },
      vehiculo: {
        select: {
          placa: true,
          marca: true,
          modelo: true,
        },
      },
    },
  });

  return conductores
    .sort((a, b) => {
      const aTime = a.tiempo_en_cola_desde?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = b.tiempo_en_cola_desde?.getTime() ?? Number.POSITIVE_INFINITY;
      return aTime - bTime || a.usuario.nombre.localeCompare(b.usuario.nombre, 'es');
    })
    .map((conductor) => ({
      id: conductor.id,
      nombre: conductor.usuario.nombre,
      rating: conductor.rating,
      totalViajes: conductor.total_viajes,
      tiempoEnColaDesde: conductor.tiempo_en_cola_desde?.toISOString() ?? null,
      minutosEnCola: minutesSince(conductor.tiempo_en_cola_desde),
      vehiculoActual: conductor.vehiculo
        ? `${conductor.vehiculo.placa} · ${conductor.vehiculo.marca} ${conductor.vehiculo.modelo}`
        : null,
    }));
}

export async function getVehiculosTenant(tenantId: string) {
  const vehiculos = await prisma.vehiculos.findMany({
    where: { tenant_id: tenantId },
    orderBy: [{ placa: 'asc' }],
  });

  return vehiculos.map((vehiculo) => ({
    id: vehiculo.id,
    placa: vehiculo.placa,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    tipo: vehiculo.tipo,
    capacidad: vehiculo.capacidad,
    color: vehiculo.color,
    anio: vehiculo.anio,
  }));
}

export async function getAdminMetricas(tenantId: string) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [reservasHoy, asignacionesHoy, conductoresActivos, vouchersEmitidos, reservasPorEstado] =
    await Promise.all([
      prisma.reservas.count({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          fecha_hora_servicio: { gte: start, lte: end },
        },
      }),
      prisma.auditoria.count({
        where: {
          tenant_id: tenantId,
          action: 'reserva_asignada',
          ts: { gte: start, lte: end },
        },
      }),
      prisma.conductores.count({
        where: {
          tenant_id: tenantId,
          usuario: {
            activo: true,
            deleted_at: null,
          },
        },
      }),
      prisma.reservas.count({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          voucher_emitido_en: { not: null },
        },
      }),
      prisma.reservas.groupBy({
        by: ['estado'],
        where: {
          tenant_id: tenantId,
          deleted_at: null,
        },
        _count: true,
      }),
    ]);

  const estadoCounts = Object.fromEntries(
    Object.values(EstadoReserva).map((estado) => [
      estado,
      reservasPorEstado.find((item) => item.estado === estado)?._count ?? 0,
    ]),
  );

  return {
    reservasHoy,
    asignacionesHoy,
    conductoresActivos,
    vouchersEmitidos,
    estadoCounts,
  };
}
