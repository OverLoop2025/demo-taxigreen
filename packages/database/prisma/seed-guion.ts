import {
  EstadoIncidencia,
  EstadoReserva,
  EstadoViaje,
  PrismaClient,
  SeveridadIncidencia,
  TipologiaIncidencia,
} from '@prisma/client';

const prisma = new PrismaClient();

const VOUCHER_CODIGO = 'TG-2026-0001';
const TENANT_NAME = 'Taxi Green Demo';

const routePoints = [
  [-12.0231, -77.112],
  [-12.0254, -77.1075],
  [-12.0302, -77.1017],
  [-12.0396, -77.0961],
  [-12.0528, -77.0894],
  [-12.0675, -77.082],
  [-12.0823, -77.0736],
  [-12.0965, -77.0632],
  [-12.1087, -77.0508],
  [-12.1196, -77.0365],
] as const;

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
    include: {
      conductor: true,
      viajes: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  });
  if (!reserva?.conductor_id) throw new Error('Reserva protagonista sin conductor asignado.');

  await deleteWaDemoReservations();
  await prisma.usuarios.updateMany({
    where: { tenant_id: tenant.id, rol: 'conductor' },
    data: { fcm_token: null },
  });

  const now = new Date();
  await prisma.reservas.update({
    where: { id: reserva.id },
    data: {
      estado: EstadoReserva.en_curso,
      calificacion: null,
      pasajero_dni: '44556677',
      pasajero_ruc: null,
      voucher_emitido_en: now,
      raw_ingesta: {
        canal: 'whatsapp_oficial',
        guion: 'S9',
        conversaciones: ['protagonista-hotel', 'empresa-factura', 'incompleta-aclaracion'],
        mensaje:
          'Hola, soy Mariana del Hilton Lima Miraflores. Necesito recojo en el Jorge Chávez para la huésped Valeria Mendoza. Llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores.',
      },
    },
  });

  await prisma.viajes.upsert({
    where: { id: 'viaje-demo-protagonista' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      conductor_id: reserva.conductor_id,
      estado: EstadoViaje.en_camino,
      inicio_en_camino: new Date(now.getTime() - 8 * 60_000),
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
      estado: EstadoViaje.en_camino,
      inicio_en_camino: new Date(now.getTime() - 8 * 60_000),
    },
  });

  await prisma.posiciones_conductor.deleteMany({ where: { conductor_id: reserva.conductor_id } });
  for (const [index, [lat, lng]] of routePoints.entries()) {
    await prisma.posiciones_conductor.create({
      data: {
        id: `posicion-guion-${String(index + 1).padStart(2, '0')}`,
        tenant_id: tenant.id,
        conductor_id: reserva.conductor_id,
        lat,
        lng,
        velocidad: index === routePoints.length - 1 ? 0 : 28,
        ts: new Date(now.getTime() - (routePoints.length - index) * 45_000),
      },
    });
  }

  await prisma.incidencias.upsert({
    where: { id: 'incidencia-demo-objeto-olvidado' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      severidad: SeveridadIncidencia.media,
      estado: EstadoIncidencia.abierta,
      descripcion: 'Pasajera reporta una casaca negra olvidada en el asiento posterior.',
      timeline: [
        { ts: now.toISOString(), actor: 'pasajero', action: 'reporte_objeto' },
        { ts: now.toISOString(), actor: 'sistema', action: 'notificacion_conductor_pendiente' },
      ],
      tpr_seg: null,
      tr_seg: null,
      closed_at: null,
      deleted_at: null,
    },
    create: {
      id: 'incidencia-demo-objeto-olvidado',
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      severidad: SeveridadIncidencia.media,
      estado: EstadoIncidencia.abierta,
      descripcion: 'Pasajera reporta una casaca negra olvidada en el asiento posterior.',
      timeline: [
        { ts: now.toISOString(), actor: 'pasajero', action: 'reporte_objeto' },
        { ts: now.toISOString(), actor: 'sistema', action: 'notificacion_conductor_pendiente' },
      ],
    },
  });

  await prisma.auditoria.deleteMany({
    where: {
      id: {
        notIn: ['auditoria-demo-seed-s1', 'auditoria-demo-seed-guion-s9'],
      },
    },
  });

  await prisma.auditoria.upsert({
    where: { id: 'auditoria-demo-seed-guion-s9' },
    update: {
      tenant_id: tenant.id,
      actor_tipo: 'sistema',
      actor_id: 'seed-guion-s9',
      action: 'seed_guion_s9',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        voucher_codigo: VOUCHER_CODIGO,
        posiciones_precargadas: routePoints.length,
        estado_viaje: EstadoViaje.en_camino,
      },
    },
    create: {
      id: 'auditoria-demo-seed-guion-s9',
      tenant_id: tenant.id,
      actor_tipo: 'sistema',
      actor_id: 'seed-guion-s9',
      action: 'seed_guion_s9',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: {
        voucher_codigo: VOUCHER_CODIGO,
        posiciones_precargadas: routePoints.length,
        estado_viaje: EstadoViaje.en_camino,
      },
    },
  });

  console.log(`Seed guion S9 listo: reserva=${reserva.id}, posiciones=${routePoints.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
