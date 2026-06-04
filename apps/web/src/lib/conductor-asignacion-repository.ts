import { EstadoReserva, Prisma, prisma, Rol } from '@taxigreen/database';
import type { ConductorTokenPayload } from '@/lib/conductor-token';

const asignacionSelect = Prisma.validator<Prisma.reservasSelect>()({
  id: true,
  voucher_codigo: true,
  tipo_viaje: true,
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

// Asignación activa del conductor: la reserva vigente (no cancelada) más reciente
// asociada a su cuenta. Permite que la app muestre el viaje al abrir, sin depender
// de un broadcast Realtime en vivo (la entrega push es opcional en la demo).
export async function findActiveAsignacionForConductor(session: ConductorTokenPayload) {
  return prisma.reservas.findFirst({
    where: {
      tenant_id: session.tenantId,
      conductor_id: session.conductorId,
      deleted_at: null,
      estado: { not: EstadoReserva.cancelada },
      ...conductorScope(session),
    },
    orderBy: { fecha_hora_servicio: 'desc' },
    select: asignacionSelect,
  });
}
