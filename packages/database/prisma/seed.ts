import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import {
  CanalOrigen,
  EstadoAbordaje,
  EstadoComprobante,
  EstadoIncidencia,
  EstadoReserva,
  EstadoViaje,
  PrismaClient,
  Rol,
  SeveridadIncidencia,
  TipoComprobante,
  TipoPago,
  TipoVehiculo,
  TipoViaje,
  TipologiaIncidencia,
} from '@prisma/client';

const prisma = new PrismaClient();

const BCRYPT_COST = 12;
const TENANT_NAME = 'Taxi Green Demo';
const TOKEN_PASAJERO = 'tg_demo_passenger_001';
const VOUCHER_CODIGO = 'TG-2026-0001';
const RENIEC_DEMO_DNIS = ['44556677', '12345678', '87654321'] as const;

function bytes(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);
  const copy = new Uint8Array(new ArrayBuffer(encoded.length));
  copy.set(encoded);
  return copy;
}

async function upsertUser({
  tenantId,
  email,
  nombre,
  rol,
  telefono,
  password,
  pin,
}: {
  tenantId: string;
  email: string;
  nombre: string;
  rol: Rol;
  telefono?: string;
  password?: string;
  pin?: string;
}) {
  const password_hash = password ? bytes(await hash(password, BCRYPT_COST)) : undefined;
  const pin_hash = pin ? bytes(await hash(pin, BCRYPT_COST)) : undefined;

  return prisma.usuarios.upsert({
    where: { email },
    update: {
      tenant_id: tenantId,
      nombre,
      rol,
      telefono,
      activo: true,
      password_hash,
      pin_hash,
      deleted_at: null,
    },
    create: {
      tenant_id: tenantId,
      email,
      nombre,
      rol,
      telefono,
      activo: true,
      password_hash,
      pin_hash,
    },
  });
}

async function main() {
  const tenant = await prisma.tenants.upsert({
    where: { nombre: TENANT_NAME },
    update: {},
    create: { nombre: TENANT_NAME },
  });

  const admin = await upsertUser({
    tenantId: tenant.id,
    email: 'admin@taxigreen.demo',
    nombre: 'Carla Torres',
    rol: Rol.admin_tenant,
    telefono: '+51900100100',
    password: 'demo1234',
  });

  await upsertUser({
    tenantId: tenant.id,
    email: 'counter@taxigreen.demo',
    nombre: 'Supervisor Counter Jorge Chávez',
    rol: Rol.supervisor,
    telefono: '+51900100101',
    password: 'demo1234',
  });

  const vehicleSeeds = [
    ['ABC-123', 'Toyota', 'Corolla Hybrid', TipoVehiculo.sedan, 4, 'Blanco', 2023],
    ['BDF-248', 'Toyota', 'Yaris', TipoVehiculo.sedan, 4, 'Verde', 2022],
    ['CGL-572', 'Toyota', 'Rav4', TipoVehiculo.camioneta, 4, 'Negro', 2023],
    ['DHK-934', 'Toyota', 'Hiace', TipoVehiculo.van, 10, 'Blanco', 2021],
    ['EJP-615', 'Toyota', 'Corolla Cross', TipoVehiculo.camioneta, 4, 'Gris', 2024],
    ['FMR-802', 'Toyota', 'Avanza', TipoVehiculo.minivan, 6, 'Plata', 2022],
    ['GNS-447', 'Toyota', 'Corolla Hybrid', TipoVehiculo.sedan, 4, 'Azul', 2024],
    ['HQT-391', 'Toyota', 'Yaris', TipoVehiculo.sedan, 4, 'Blanco', 2021],
  ] as const;

  const vehicles = [];
  for (const [placa, marca, modelo, tipo, capacidad, color, anio] of vehicleSeeds) {
    vehicles.push(
      await prisma.vehiculos.upsert({
        where: { placa },
        update: { tenant_id: tenant.id, marca, modelo, tipo, capacidad, color, anio },
        create: { tenant_id: tenant.id, placa, marca, modelo, tipo, capacidad, color, anio },
      }),
    );
  }

  const driverSeeds = [
    ['conductor1@taxigreen.demo', 'Raúl Quispe', '1234', 'A-I-123456', 4.9, 487],
    ['conductor2@taxigreen.demo', 'Mario Huamán', '2345', 'A-II-234567', 4.8, 431],
    ['conductor3@taxigreen.demo', 'Lucía Pérez', '3456', 'A-I-345678', 4.95, 512],
    ['conductor4@taxigreen.demo', 'Javier Ríos', '4567', 'A-II-456789', 4.7, 366],
    ['conductor5@taxigreen.demo', 'Ana Salazar', '5678', 'A-I-567890', 4.85, 452],
    ['conductor6@taxigreen.demo', 'Pedro Morales', '6789', 'A-II-678901', 4.75, 398],
  ] as const;

  const drivers = [];
  const now = new Date();
  for (const [index, seed] of driverSeeds.entries()) {
    const [email, nombre, pin, licencia, rating, total_viajes] = seed;
    const user = await upsertUser({
      tenantId: tenant.id,
      email,
      nombre,
      rol: Rol.conductor,
      telefono: `+51900${String(200 + index).padStart(6, '0')}`,
      pin,
    });

    const driver = await prisma.conductores.upsert({
      where: { usuario_id: user.id },
      update: {
        tenant_id: tenant.id,
        licencia,
        rating,
        total_viajes,
        vehiculo_id: vehicles[index]?.id,
        tiempo_en_cola_desde: new Date(now.getTime() - (index + 1) * 9 * 60_000),
      },
      create: {
        tenant_id: tenant.id,
        usuario_id: user.id,
        licencia,
        rating,
        total_viajes,
        vehiculo_id: vehicles[index]?.id,
        tiempo_en_cola_desde: new Date(now.getTime() - (index + 1) * 9 * 60_000),
      },
    });
    drivers.push(driver);
  }

  const protagonistDriver = drivers[0];
  if (!protagonistDriver) {
    throw new Error('No se pudo crear conductor protagonista.');
  }

  const reserva = await prisma.reservas.upsert({
    where: { voucher_codigo: VOUCHER_CODIGO },
    update: {
      tenant_id: tenant.id,
      canal_origen: CanalOrigen.whatsapp_oficial,
      tipo_viaje: TipoViaje.recojo_aeropuerto,
      solicitante_tipo: 'hotel',
      solicitante_nombre: 'Concierge hotel',
      solicitante_contacto: '+51999111222',
      pasajero_nombre: 'Valeria Mendoza',
      pasajero_telefono: '+51988777666',
      pasajero_email: 'pasajero.demo@example.com',
      pasajero_dni: '44556677',
      origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
      origen_lat: -12.0231,
      origen_lng: -77.112,
      destino_texto: 'Av. Pardo 123, Miraflores',
      destino_lat: -12.1196,
      destino_lng: -77.0365,
      punto_encuentro: 'Salida 3, columna F2',
      fecha_hora_servicio: new Date('2026-06-01T03:45:00-05:00'),
      vuelo_codigo: 'LA2456',
      tipo_pago: TipoPago.voucher_hotel,
      estado: EstadoReserva.asignada,
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
      counter_validado_en: null,
      counter_usuario_id: null,
      token_pasajero: TOKEN_PASAJERO,
      voucher_qr_payload: `demo:${VOUCHER_CODIGO}:${nanoid(8)}`,
      voucher_emitido_en: now,
      raw_ingesta: {
        canal: 'whatsapp_oficial',
        reniec_demo_dnis: RENIEC_DEMO_DNIS,
        mensaje:
          'Hola, soy el concierge. Necesito recojo en el Jorge Chávez para una huésped que llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores.',
      },
      sugerencia_copiloto: {
        fuente: 'algoritmo',
        motivo: 'Conductor con mayor tiempo en cola y unidad sedan suficiente.',
        score: 91,
      },
      hotel_nombre: 'Concierge hotel',
      empresa_nombre: 'Hotel aliado demo',
      conductor_id: protagonistDriver.id,
      deleted_at: null,
    },
    create: {
      tenant_id: tenant.id,
      canal_origen: CanalOrigen.whatsapp_oficial,
      tipo_viaje: TipoViaje.recojo_aeropuerto,
      solicitante_tipo: 'hotel',
      solicitante_nombre: 'Concierge hotel',
      solicitante_contacto: '+51999111222',
      pasajero_nombre: 'Valeria Mendoza',
      pasajero_telefono: '+51988777666',
      pasajero_email: 'pasajero.demo@example.com',
      pasajero_dni: '44556677',
      origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
      origen_lat: -12.0231,
      origen_lng: -77.112,
      destino_texto: 'Av. Pardo 123, Miraflores',
      destino_lat: -12.1196,
      destino_lng: -77.0365,
      punto_encuentro: 'Salida 3, columna F2',
      fecha_hora_servicio: new Date('2026-06-01T03:45:00-05:00'),
      vuelo_codigo: 'LA2456',
      tipo_pago: TipoPago.voucher_hotel,
      estado: EstadoReserva.asignada,
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
      token_pasajero: TOKEN_PASAJERO,
      voucher_codigo: VOUCHER_CODIGO,
      voucher_qr_payload: `demo:${VOUCHER_CODIGO}:${nanoid(8)}`,
      voucher_emitido_en: now,
      raw_ingesta: {
        canal: 'whatsapp_oficial',
        reniec_demo_dnis: RENIEC_DEMO_DNIS,
        mensaje:
          'Hola, soy el concierge. Necesito recojo en el Jorge Chávez para una huésped que llega mañana 03:45 en vuelo LA2456. Punto de encuentro Salida 3 columna F2. Destino Av. Pardo 123, Miraflores.',
      },
      sugerencia_copiloto: {
        fuente: 'algoritmo',
        motivo: 'Conductor con mayor tiempo en cola y unidad sedan suficiente.',
        score: 91,
      },
      hotel_nombre: 'Concierge hotel',
      empresa_nombre: 'Hotel aliado demo',
      conductor_id: protagonistDriver.id,
    },
  });

  await prisma.viajes.upsert({
    where: { id: 'viaje-demo-protagonista' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      conductor_id: protagonistDriver.id,
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
      conductor_id: protagonistDriver.id,
      estado: EstadoViaje.asignado,
    },
  });

  await prisma.posiciones_conductor.upsert({
    where: { id: 'posicion-demo-conductor-1' },
    update: {
      tenant_id: tenant.id,
      conductor_id: protagonistDriver.id,
      lat: -12.0231,
      lng: -77.112,
      velocidad: 0,
    },
    create: {
      id: 'posicion-demo-conductor-1',
      tenant_id: tenant.id,
      conductor_id: protagonistDriver.id,
      lat: -12.0231,
      lng: -77.112,
      velocidad: 0,
    },
  });

  await prisma.comprobantes.upsert({
    where: { tipo_serie_correlativo: { tipo: TipoComprobante.boleta, serie: 'B001', correlativo: 1 } },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      monto: 75,
      estado: EstadoComprobante.pendiente,
    },
    create: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      tipo: TipoComprobante.boleta,
      serie: 'B001',
      correlativo: 1,
      monto: 75,
      estado: EstadoComprobante.pendiente,
    },
  });

  await prisma.incidencias.upsert({
    where: { id: 'incidencia-demo-objeto-olvidado' },
    update: {
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      severidad: SeveridadIncidencia.baja,
      estado: EstadoIncidencia.cerrada,
      descripcion: 'Pasajero reporta una casaca olvidada en la unidad.',
      timeline: [
        { ts: '2026-06-01T05:20:00-05:00', actor: 'pasajero', action: 'reporte_objeto' },
        { ts: '2026-06-01T05:23:00-05:00', actor: 'conductor', action: 'objeto_encontrado' },
        { ts: '2026-06-01T05:32:00-05:00', actor: 'operador', action: 'entrega_coordinada' },
      ],
      tpr_seg: 180,
      tr_seg: 720,
      closed_at: new Date('2026-06-01T05:32:00-05:00'),
      deleted_at: null,
    },
    create: {
      id: 'incidencia-demo-objeto-olvidado',
      tenant_id: tenant.id,
      reserva_id: reserva.id,
      tipologia: TipologiaIncidencia.objeto_olvidado,
      severidad: SeveridadIncidencia.baja,
      estado: EstadoIncidencia.cerrada,
      descripcion: 'Pasajero reporta una casaca olvidada en la unidad.',
      timeline: [
        { ts: '2026-06-01T05:20:00-05:00', actor: 'pasajero', action: 'reporte_objeto' },
        { ts: '2026-06-01T05:23:00-05:00', actor: 'conductor', action: 'objeto_encontrado' },
        { ts: '2026-06-01T05:32:00-05:00', actor: 'operador', action: 'entrega_coordinada' },
      ],
      tpr_seg: 180,
      tr_seg: 720,
      closed_at: new Date('2026-06-01T05:32:00-05:00'),
    },
  });

  await prisma.auditoria.upsert({
    where: { id: 'auditoria-demo-seed-s1' },
    update: {
      tenant_id: tenant.id,
      actor_tipo: 'usuario',
      actor_id: admin.id,
      action: 'seed_sprint_1',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: { voucher_codigo: VOUCHER_CODIGO, token_pasajero: TOKEN_PASAJERO },
      fuente_decision: { fuente: 'algoritmo', motivo: 'seed_idempotente' },
    },
    create: {
      id: 'auditoria-demo-seed-s1',
      tenant_id: tenant.id,
      actor_tipo: 'usuario',
      actor_id: admin.id,
      action: 'seed_sprint_1',
      target_table: 'reservas',
      target_id: reserva.id,
      payload: { voucher_codigo: VOUCHER_CODIGO, token_pasajero: TOKEN_PASAJERO },
      fuente_decision: { fuente: 'algoritmo', motivo: 'seed_idempotente' },
    },
  });

  console.log(`Seed Sprint 1 listo: tenant=${tenant.id}, reserva=${reserva.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
