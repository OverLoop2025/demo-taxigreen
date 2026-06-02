import { prisma, Rol } from '@taxigreen/database';
import type { ConductorTokenPayload } from '@/lib/conductor-token';

export async function findAsignacionForConductor(session: ConductorTokenPayload, reservaId: string) {
  return prisma.reservas.findFirst({
    where: {
      id: reservaId,
      tenant_id: session.tenantId,
      conductor_id: session.conductorId,
      deleted_at: null,
      conductor: {
        usuario: {
          id: session.userId,
          rol: Rol.conductor,
          activo: true,
          deleted_at: null,
        },
      },
    },
    select: {
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
          conductor_id: session.conductorId,
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
    },
  });
}
