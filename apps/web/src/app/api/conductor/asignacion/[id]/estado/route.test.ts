import { beforeEach, describe, expect, it, vi } from 'vitest';

const { broadcastReservaEstado, findAsignacionForConductor, recordAudit, tx, verifyConductorToken } =
  vi.hoisted(() => ({
    broadcastReservaEstado: vi.fn(),
    findAsignacionForConductor: vi.fn(),
    recordAudit: vi.fn(),
    tx: {
      reservas: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      pagos: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      comprobantes: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      auditoria: {
        create: vi.fn(),
      },
      viajes: {
        update: vi.fn(),
      },
    },
    verifyConductorToken: vi.fn(),
  }));

vi.mock('@taxigreen/auditoria', () => ({
  recordAudit,
}));

vi.mock('@taxigreen/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@taxigreen/database')>();
  return {
    ...actual,
    prisma: {
      $transaction: vi.fn((callback) => callback(tx)),
    },
  };
});

vi.mock('@/lib/conductor-token', () => ({
  bearerTokenFromRequest: (request: Request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
  verifyConductorToken,
}));

vi.mock('@/lib/conductor-asignacion-repository', () => ({
  findAsignacionForConductor,
}));

vi.mock('@/lib/supabase/server', () => ({
  broadcastReservaEstado,
}));

import { EstadoAbordaje, EstadoPago, EstadoReserva, EstadoViaje, Prisma, TipoComprobante, TipoPago, TipoViaje } from '@taxigreen/database';
import { POST } from './route';

const session = {
  userId: 'user-cond-1',
  tenantId: 'tenant-1',
  conductorId: 'cond-1',
  email: 'conductor1@taxigreen.demo',
  nombre: 'Raúl Quispe',
  role: 'conductor' as const,
};

const assignedReserva = {
  id: 'reserva-1',
  tenant_id: 'tenant-1',
  voucher_codigo: 'TG-2026-0001',
  tipo_viaje: TipoViaje.recojo_aeropuerto,
  tipo_pago: TipoPago.voucher_hotel,
  responsable_pago: 'hotel',
  requiere_factura: false,
  pasajero_ruc: null,
  cotizacion_monto: new Prisma.Decimal('75.00'),
  estado_abordaje: EstadoAbordaje.pendiente_validacion,
  estado: EstadoReserva.asignada,
  viajes: [{ id: 'viaje-1', estado: EstadoViaje.asignado }],
};

const serializedFixture = {
  id: 'reserva-1',
  voucher_codigo: 'TG-2026-0001',
  tipo_viaje: TipoViaje.recojo_aeropuerto,
  tipo_pago: TipoPago.voucher_hotel,
  perfil_pasajero: 'hotel',
  responsable_pago: 'hotel',
  convenio_validado_demo: true,
  requiere_factura: false,
  vehiculo_preferencia: 'sedan',
  pasajeros_cantidad: 2,
  equipaje_nivel: 'normal',
  empresa_nombre: null,
  hotel_nombre: 'Hilton Lima Miraflores',
  fecha_hora_servicio: new Date('2026-06-05T15:00:00.000Z'),
  estado: EstadoReserva.en_curso,
  pasajero_nombre: 'Valeria Mendoza',
  pasajero_telefono: '+51 999 111 222',
  pasajero_email: null,
  pasajero_dni: null,
  vuelo_codigo: 'LA2456',
  origen_texto: 'Aeropuerto Jorge Chávez - Llegadas',
  origen_lat: -12.0231,
  origen_lng: -77.112,
  punto_encuentro: 'Salida 3, columna F2',
  destino_texto: 'Av. Pardo 123, Miraflores',
  destino_lat: -12.1196,
  destino_lng: -77.0365,
  voucher_emitido_en: new Date('2026-06-05T12:00:00.000Z'),
  token_pasajero: 'tg_demo_passenger_001',
  estado_abordaje: EstadoAbordaje.autorizado,
  counter_validado_en: new Date('2026-06-05T14:58:00.000Z'),
  cotizacion_monto: new Prisma.Decimal('75.00'),
  cotizacion_moneda: 'PEN',
  pago: {
    tipo_pago: TipoPago.voucher_hotel,
    estado: EstadoPago.autorizado,
    monto: new Prisma.Decimal('75.00'),
    moneda: 'PEN',
  },
  conductor: {
    id: 'cond-1',
    rating: 4.9,
    total_viajes: 320,
    usuario: { nombre: 'Raúl Quispe', telefono: '+51 988 777 666' },
    vehiculo: {
      id: 'veh-1',
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Corolla',
      tipo: 'sedan' as const,
      capacidad: 4,
      color: 'Plata',
      anio: 2022,
    },
  },
  viajes: [
    {
      id: 'viaje-1',
      estado: EstadoViaje.en_camino,
      inicio_en_camino: new Date('2026-06-05T15:05:00.000Z'),
      llegada_punto: null,
      pasajero_a_bordo: null,
      finalizado_en: null,
      updated_at: new Date('2026-06-05T15:05:00.000Z'),
    },
  ],
};

function postEstado(estadoNuevo: EstadoViaje) {
  return POST(
    new Request('http://localhost/api/conductor/asignacion/reserva-1/estado', {
      method: 'POST',
      headers: { authorization: 'Bearer conductor-token' },
      body: JSON.stringify({ estado_nuevo: estadoNuevo }),
    }),
    { params: Promise.resolve({ id: 'reserva-1' }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyConductorToken.mockResolvedValue(session);
  tx.reservas.findFirst.mockResolvedValue(assignedReserva);
  tx.viajes.update.mockResolvedValue({});
  tx.reservas.update.mockResolvedValue({});
  tx.pagos.findUnique.mockResolvedValue({
    id: 'pago-1',
    tenant_id: 'tenant-1',
    reserva_id: 'reserva-1',
    tipo_pago: TipoPago.voucher_hotel,
    estado: EstadoPago.autorizado,
    monto: new Prisma.Decimal('75.00'),
    moneda: 'PEN',
    proveedor_demo: 'credito_hotel_demo',
    autorizacion: null,
    payload_demo: {},
    autorizado_en: new Date('2026-06-05T14:50:00.000Z'),
    capturado_en: null,
    created_at: new Date('2026-06-05T14:50:00.000Z'),
    updated_at: new Date('2026-06-05T14:50:00.000Z'),
  });
  tx.pagos.update.mockImplementation(async (args: Prisma.pagosUpdateArgs) => ({
    id: 'pago-1',
    tenant_id: 'tenant-1',
    reserva_id: 'reserva-1',
    tipo_pago: TipoPago.voucher_hotel,
    estado: args.data.estado ?? EstadoPago.por_liquidar,
    monto: new Prisma.Decimal('75.00'),
    moneda: 'PEN',
    proveedor_demo: 'credito_hotel_demo',
    autorizacion: null,
    payload_demo: args.data.payload_demo ?? {},
    autorizado_en: new Date('2026-06-05T14:50:00.000Z'),
    capturado_en: null,
    created_at: new Date('2026-06-05T14:50:00.000Z'),
    updated_at: new Date('2026-06-05T15:30:00.000Z'),
  }));
  tx.comprobantes.findFirst.mockImplementation(async (args: Prisma.comprobantesFindFirstArgs) => {
    if (args.select?.correlativo && Object.keys(args.select).length === 1) return { correlativo: 11 };
    return null;
  });
  tx.comprobantes.create.mockImplementation(async (args: Prisma.comprobantesCreateArgs) => ({
    id: 'comp-1',
    tipo: args.data.tipo as TipoComprobante,
    serie: args.data.serie as string,
    correlativo: args.data.correlativo as number,
    monto: args.data.monto as Prisma.Decimal,
    estado: args.data.estado,
  }));
  tx.auditoria.create.mockResolvedValue({});
  findAsignacionForConductor.mockResolvedValue(serializedFixture);
  broadcastReservaEstado.mockResolvedValue({ ok: true });
});

describe('POST /api/conductor/asignacion/[id]/estado — gate counter', () => {
  it('bloquea en_camino para recojo_aeropuerto pendiente de counter', async () => {
    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'counter_pendiente',
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
    });
    expect(tx.viajes.update).not.toHaveBeenCalled();
    expect(tx.reservas.update).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'driver_inicio_bloqueado_counter',
        payload: expect.objectContaining({
          reserva_id: 'reserva-1',
          estado_abordaje: EstadoAbordaje.pendiente_validacion,
        }),
      }),
    );
  });

  it('permite en_camino para recojo_aeropuerto autorizado por counter', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      estado_abordaje: EstadoAbordaje.autorizado,
    });

    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.asignacion.abordaje.autorizado).toBe(true);
    expect(body.asignacion.comercial.pagoConductor).toBe('Cargo al hotel - no cobres al pasajero');
    expect(tx.viajes.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'viaje-1' },
        data: expect.objectContaining({ estado: EstadoViaje.en_camino }),
      }),
    );
    expect(tx.reservas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reserva-1' },
        data: { estado: EstadoReserva.en_curso },
      }),
    );
  });

  it('permite traslado_aeropuerto aunque no requiera counter', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      tipo_viaje: TipoViaje.traslado_aeropuerto,
      estado_abordaje: EstadoAbordaje.no_requerido,
    });
    findAsignacionForConductor.mockResolvedValue({
      ...serializedFixture,
      tipo_viaje: TipoViaje.traslado_aeropuerto,
      estado_abordaje: EstadoAbordaje.no_requerido,
      counter_validado_en: null,
    });

    const response = await postEstado(EstadoViaje.en_camino);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.asignacion.abordaje).toEqual({
      requiereCounter: false,
      autorizado: true,
      counterValidadoEn: null,
    });
  });

  it('al finalizar cierra pago y prepara comprobante en la misma transacción', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      estado: EstadoReserva.en_curso,
      estado_abordaje: EstadoAbordaje.autorizado,
      viajes: [{ id: 'viaje-1', estado: EstadoViaje.a_bordo }],
    });
    findAsignacionForConductor.mockResolvedValue({
      ...serializedFixture,
      estado: EstadoReserva.por_liquidar,
      viajes: [
        {
          ...serializedFixture.viajes[0],
          estado: EstadoViaje.finalizado,
          finalizado_en: new Date('2026-06-05T15:30:00.000Z'),
        },
      ],
    });

    const response = await postEstado(EstadoViaje.finalizado);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(tx.pagos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reserva_id: 'reserva-1' },
        data: expect.objectContaining({ estado: EstadoPago.por_liquidar }),
      }),
    );
    expect(tx.comprobantes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: TipoComprobante.boleta,
          serie: 'B001',
          correlativo: 12,
          estado: 'pendiente',
        }),
      }),
    );
    expect(tx.auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'pago_demo_cerrado',
          target_table: 'pagos',
        }),
      }),
    );
    expect(tx.auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'comprobante_preparado',
          target_table: 'comprobantes',
          target_id: 'comp-1',
        }),
      }),
    );
  });

  it('F6: si paga el pasajero, finalizar deja por_cobrar y no prepara comprobante', async () => {
    tx.reservas.findFirst.mockResolvedValue({
      ...assignedReserva,
      tipo_pago: TipoPago.app_pago,
      responsable_pago: 'pasajero',
      estado: EstadoReserva.en_curso,
      estado_abordaje: EstadoAbordaje.autorizado,
      viajes: [{ id: 'viaje-1', estado: EstadoViaje.a_bordo }],
    });
    findAsignacionForConductor.mockResolvedValue({
      ...serializedFixture,
      estado: EstadoReserva.por_liquidar,
      viajes: [
        {
          ...serializedFixture.viajes[0],
          estado: EstadoViaje.finalizado,
          finalizado_en: new Date('2026-06-05T15:30:00.000Z'),
        },
      ],
    });

    const response = await postEstado(EstadoViaje.finalizado);

    expect(response.status).toBe(200);
    expect(tx.pagos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reserva_id: 'reserva-1' },
        data: expect.objectContaining({ estado: EstadoPago.por_cobrar }),
      }),
    );
    expect(tx.comprobantes.create).not.toHaveBeenCalled();
    expect(tx.auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'pago_demo_cerrado',
          payload: expect.objectContaining({ requiere_accion_pasajero: true }),
        }),
      }),
    );
  });
});
