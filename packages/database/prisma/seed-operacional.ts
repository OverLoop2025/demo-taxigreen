import {
  EstadoAbordaje,
  EstadoReserva,
  EstadoViaje,
  PerfilPasajero,
  Prisma,
  PrismaClient,
  ResponsablePago,
  TipoPago,
  TipoVehiculo,
} from '@prisma/client';

const prisma = new PrismaClient();

const VOUCHER_CODIGO = 'TG-2026-0001';
const VOUCHER_CODIGO_TRASLADO = 'TG-2026-0002';
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
  await prisma.pagos.deleteMany({ where: { reserva_id: { in: ids } } });
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
  const reservaTraslado = await prisma.reservas.findUnique({
    where: { voucher_codigo: VOUCHER_CODIGO_TRASLADO },
    select: {
      id: true,
      conductor_id: true,
      voucher_codigo: true,
    },
  });
  if (!reservaTraslado?.conductor_id) throw new Error('Reserva B sin conductor asignado.');

  await deleteWaDemoReservations();

  await prisma.auditoria.deleteMany({
    where: {
      target_table: 'reservas',
      target_id: { in: [reserva.id, reservaTraslado.id] },
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
      perfil_pasajero: PerfilPasajero.hotel,
      responsable_pago: ResponsablePago.hotel,
      convenio_validado_demo: true,
      requiere_factura: false,
      vehiculo_preferencia: TipoVehiculo.sedan,
      pasajeros_cantidad: 2,
      equipaje_nivel: 'normal',
      solicitante_nombre: 'Hilton Lima Miraflores',
      hotel_nombre: 'Hilton Lima Miraflores',
      empresa_nombre: null,
      calificacion: Prisma.JsonNull,
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

  await prisma.reservas.update({
    where: { id: reservaTraslado.id },
    data: {
      estado: EstadoReserva.asignada,
      estado_abordaje: EstadoAbordaje.no_requerido,
      counter_validado_en: null,
      counter_usuario_id: null,
      tipo_pago: TipoPago.factura_empresa,
      perfil_pasajero: PerfilPasajero.corporativo,
      responsable_pago: ResponsablePago.empresa,
      convenio_validado_demo: true,
      requiere_factura: true,
      vehiculo_preferencia: TipoVehiculo.camioneta,
      pasajeros_cantidad: 1,
      equipaje_nivel: 'normal',
      empresa_nombre: 'ACME Perú',
      hotel_nombre: null,
      calificacion: Prisma.JsonNull,
      deleted_at: null,
    },
  });

  await prisma.viajes.upsert({
    where: { id: 'viaje-demo-traslado-b' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reservaTraslado.id,
      conductor_id: reservaTraslado.conductor_id,
      estado: EstadoViaje.asignado,
      inicio_en_camino: null,
      llegada_punto: null,
      pasajero_a_bordo: null,
      finalizado_en: null,
      deleted_at: null,
    },
    create: {
      id: 'viaje-demo-traslado-b',
      tenant_id: tenant.id,
      reserva_id: reservaTraslado.id,
      conductor_id: reservaTraslado.conductor_id,
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
      actor_id: 'seed-operacional-f5',
      action: 'seed_operacional_f5',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        escenario_a: {
          voucher_codigo: reserva.voucher_codigo,
          estado_reserva: EstadoReserva.asignada,
          estado_viaje: EstadoViaje.asignado,
          estado_abordaje: EstadoAbordaje.pendiente_validacion,
          perfil_pasajero: PerfilPasajero.hotel,
          responsable_pago: ResponsablePago.hotel,
        },
        escenario_b: {
          voucher_codigo: reservaTraslado.voucher_codigo,
          estado_reserva: EstadoReserva.asignada,
          estado_viaje: EstadoViaje.asignado,
          estado_abordaje: EstadoAbordaje.no_requerido,
          perfil_pasajero: PerfilPasajero.corporativo,
          responsable_pago: ResponsablePago.empresa,
        },
      },
    },
    create: {
      id: 'auditoria-demo-seed-operacional-f1',
      tenant_id: tenant.id,
      actor_tipo: 'sistema',
      actor_id: 'seed-operacional-f5',
      action: 'seed_operacional_f5',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        escenario_a: {
          voucher_codigo: reserva.voucher_codigo,
          estado_reserva: EstadoReserva.asignada,
          estado_viaje: EstadoViaje.asignado,
          estado_abordaje: EstadoAbordaje.pendiente_validacion,
          perfil_pasajero: PerfilPasajero.hotel,
          responsable_pago: ResponsablePago.hotel,
        },
        escenario_b: {
          voucher_codigo: reservaTraslado.voucher_codigo,
          estado_reserva: EstadoReserva.asignada,
          estado_viaje: EstadoViaje.asignado,
          estado_abordaje: EstadoAbordaje.no_requerido,
          perfil_pasajero: PerfilPasajero.corporativo,
          responsable_pago: ResponsablePago.empresa,
        },
      },
    },
  });

  console.log(
    `Seed operacional F5 listo: A=${reserva.id}/hotel-hotel/pendiente_validacion, B=${reservaTraslado.id}/corporativo-empresa/no_requerido`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
