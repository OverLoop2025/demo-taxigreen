import {
  EstadoAbordaje,
  EstadoReserva,
  EstadoViaje,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const VOUCHER_CODIGO = 'TG-2026-0001';
const TENANT_NAME = 'Taxi Green Demo';

async function deleteWaDemoReservations() {
  const reservations = await prisma.reservas.findMany({
    where: { voucher_codigo: { startsWith: 'TG-WA-' } },
    select: { id: true },
  });
  const ids = reservations.map((reservation) => reservation.id);
  if (ids.length === 0) return;

  await prisma.auditoria.deleteMany({ where: { target_table: 'reservas', target_id: { in: ids } } });
  await prisma.incidencias.deleteMany({ where: { reserva_id: { in: ids } } });
  await prisma.comprobantes.deleteMany({ where: { reserva_id: { in: ids } } });
  await prisma.viajes.deleteMany({ where: { reserva_id: { in: ids } } });
  await prisma.reservas.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  const tenant = await prisma.tenants.findUnique({ where: { nombre: TENANT_NAME } });
  if (!tenant) throw new Error('Ejecuta primero db:seed: tenant demo no encontrado.');

  const reserva = await prisma.reservas.findUnique({
    where: { voucher_codigo: VOUCHER_CODIGO },
    select: {
      id: true,
      conductor_id: true,
      voucher_codigo: true,
    },
  });
  if (!reserva?.conductor_id) throw new Error('Reserva protagonista sin conductor asignado.');

  await deleteWaDemoReservations();

  await prisma.auditoria.deleteMany({
    where: {
      target_table: 'reservas',
      target_id: reserva.id,
      action: {
        in: [
          'voucher_qr_emitido',
          'voucher_qr_verificado',
          'voucher_qr_consumido',
          'voucher_qr_reuso_bloqueado',
          'abordaje_autorizado',
          'driver_inicio_bloqueado_counter',
          'driver_estado_viaje_actualizado',
        ],
      },
    },
  });

  await prisma.reservas.update({
    where: { id: reserva.id },
    data: {
      estado: EstadoReserva.asignada,
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
      counter_validado_en: null,
      counter_usuario_id: null,
      calificacion: null,
      deleted_at: null,
    },
  });

  await prisma.viajes.upsert({
    where: { id: 'viaje-demo-protagonista' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      conductor_id: reserva.conductor_id,
      estado: EstadoViaje.asignado,
      inicio_en_camino: null,
      llegada_punto: null,
      pasajero_a_bordo: null,
      finalizado_en: null,
      deleted_at: null,
    },
    create: {
      id: 'viaje-demo-protagonista',
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      conductor_id: reserva.conductor_id,
      estado: EstadoViaje.asignado,
    },
  });

  await prisma.usuarios.updateMany({
    where: { tenant_id: tenant.id, rol: 'conductor' },
    data: { fcm_token: null },
  });

  await prisma.auditoria.upsert({
    where: { id: 'auditoria-demo-seed-operacional-f1' },
    update: {
      tenant_id: tenant.id,
      actor_tipo: 'sistema',
      actor_id: 'seed-operacional-f1',
      action: 'seed_operacional_f1',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        voucher_codigo: reserva.voucher_codigo,
        estado_reserva: EstadoReserva.asignada,
        estado_viaje: EstadoViaje.asignado,
        estado_abordaje: EstadoAbordaje.pendiente_validacion,
      },
    },
    create: {
      id: 'auditoria-demo-seed-operacional-f1',
      tenant_id: tenant.id,
      actor_tipo: 'sistema',
      actor_id: 'seed-operacional-f1',
      action: 'seed_operacional_f1',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        voucher_codigo: reserva.voucher_codigo,
        estado_reserva: EstadoReserva.asignada,
        estado_viaje: EstadoViaje.asignado,
        estado_abordaje: EstadoAbordaje.pendiente_validacion,
      },
    },
  });

  console.log(`Seed operacional F1 listo: reserva=${reserva.id}, estado_abordaje=pendiente_validacion`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
