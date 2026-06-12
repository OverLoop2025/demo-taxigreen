import { EstadoReserva, Prisma, prisma, Rol } from '@taxigreen/database';
import type { ConductorTokenPayload } from '@/lib/conductor-token';

const asignacionSelect = Prisma.validator<Prisma.reservasSelect>()({
  id: true,
  voucher_codigo: true,
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
  fecha_hora_servicio: true,
  estado: true,
  pasajero_nombre: true,
  pasajero_telefono: true,
  pasajero_email: true,
  pasajero_dni: true,
  vuelo_codigo: true,
  origen_texto: true,
  origen_lat: true,
  origen_lng: true,
  punto_encuentro: true,
  destino_texto: true,
  destino_lat: true,
  destino_lng: true,
  voucher_emitido_en: true,
  token_pasajero: true,
  estado_abordaje: true,
  counter_validado_en: true,
  cotizacion_monto: true,
  cotizacion_moneda: true,
  pago: {
    select: {
      tipo_pago: true,
      estado: true,
      monto: true,
      moneda: true,
    },
  },
  conductor: {
    select: {
      id: true,
      rating: true,
      total_viajes: true,
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
        },
      },
    },
  },
  viajes: {
    where: {
      deleted_at: null,
    },
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
});

// Scope de seguridad: la reserva debe pertenecer a un usuario conductor activo.
function conductorScope(session: ConductorTokenPayload) {
  return {
    conductor: {
      usuario: {
        id: session.userId,
        rol: Rol.conductor,
        activo: true,
        deleted_at: null,
      },
    },
  } satisfies Prisma.reservasWhereInput;
}

export async function findAsignacionForConductor(session: ConductorTokenPayload, reservaId: string) {
  return prisma.reservas.findFirst({
    where: {
      id: reservaId,
      tenant_id: session.tenantId,
      conductor_id: session.conductorId,
      deleted_at: null,
      ...conductorScope(session),
    },
    select: asignacionSelect,
  });
}

// Asignación activa del conductor: la reserva VIGENTE más reciente (no cerrada)
// asociada a su cuenta. "Vigente" excluye los desenlaces cerrados (finalizada /
// por liquidar / cancelada): esos viajes viven en el historial, no en "tienes un
// viaje". Permite que la app muestre el viaje al abrir, sin depender de un broadcast.
const estadosReservaCerrados = [
  EstadoReserva.finalizada,
  EstadoReserva.por_liquidar,
  EstadoReserva.cancelada,
] as const;

export async function findActiveAsignacionForConductor(session: ConductorTokenPayload) {
  return prisma.reservas.findFirst({
    where: {
      tenant_id: session.tenantId,
      conductor_id: session.conductorId,
      deleted_at: null,
      estado: { notIn: [...estadosReservaCerrados] },
      ...conductorScope(session),
    },
    orderBy: { fecha_hora_servicio: 'desc' },
    select: asignacionSelect,
  });
}

// Select ligero para el HISTORIAL del conductor: sólo lo que la lista necesita
// (no datos sensibles del pasajero ni voucher). El estado vivo sale del último viaje.
const historialSelect = Prisma.validator<Prisma.reservasSelect>()({
  id: true,
  tipo_viaje: true,
  fecha_hora_servicio: true,
  estado: true,
  pasajero_nombre: true,
  origen_texto: true,
  destino_texto: true,
  vuelo_codigo: true,
  estado_abordaje: true,
  counter_validado_en: true,
  conductor: {
    select: {
      vehiculo: { select: { placa: true, marca: true, modelo: true } },
    },
  },
  viajes: {
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 1,
    select: { estado: true, finalizado_en: true, updated_at: true },
  },
});

export type ConductorHistorialRow = Prisma.reservasGetPayload<{ select: typeof historialSelect }>;

// Historial de viajes del conductor: sus reservas más recientes (incluye la activa
// y las finalizadas/canceladas) para que la app las agrupe en activo vs cerrado.
export async function findHistorialForConductor(session: ConductorTokenPayload, limit = 30) {
  return prisma.reservas.findMany({
    where: {
      tenant_id: session.tenantId,
      conductor_id: session.conductorId,
      deleted_at: null,
      ...conductorScope(session),
    },
    orderBy: { fecha_hora_servicio: 'desc' },
    take: limit,
    select: historialSelect,
  });
}
