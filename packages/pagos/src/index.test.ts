import { describe, expect, it, vi } from 'vitest';
import { EstadoPago, Prisma, TipoPago } from '@taxigreen/database';
import {
  anularPagoDemo,
  autorizarPagoDemo,
  calcularCotizacionDemo,
  capturarPagoPasajeroDemo,
  cerrarPagoDemo,
  estadoPagoHumano,
  serializarPagoDemo,
} from './index';

function fakeDb() {
  const store = new Map<string, Awaited<ReturnType<typeof autorizarPagoDemo>>>();
  return {
    store,
    db: {
      pagos: {
        upsert: vi.fn(async (args) => {
          const existing = store.get(args.where.reserva_id);
          const next = {
            id: existing?.id ?? 'pago-1',
            tenant_id: existing?.tenant_id ?? args.create.tenant_id,
            reserva_id: args.where.reserva_id,
            tipo_pago: args.update.tipo_pago ?? args.create.tipo_pago,
            estado: args.update.estado ?? args.create.estado,
            monto: args.update.monto ?? args.create.monto,
            moneda: args.update.moneda ?? args.create.moneda,
            proveedor_demo: args.update.proveedor_demo ?? args.create.proveedor_demo ?? null,
            autorizacion: args.update.autorizacion ?? args.create.autorizacion ?? null,
            payload_demo: args.update.payload_demo ?? args.create.payload_demo ?? null,
            autorizado_en: args.update.autorizado_en ?? args.create.autorizado_en ?? null,
            capturado_en: args.update.capturado_en ?? args.create.capturado_en ?? null,
            created_at: existing?.created_at ?? new Date('2026-06-01T10:00:00.000Z'),
            updated_at: new Date('2026-06-01T10:01:00.000Z'),
          };
          store.set(args.where.reserva_id, next as Awaited<ReturnType<typeof autorizarPagoDemo>>);
          return next as Awaited<ReturnType<typeof autorizarPagoDemo>>;
        }),
        findUnique: vi.fn(async (args) => store.get(args.where.reserva_id) ?? null),
        update: vi.fn(async (args) => {
          const existing = store.get(args.where.reserva_id);
          if (!existing) throw new Error('not found');
          const next = { ...existing, ...args.data, updated_at: new Date('2026-06-01T10:02:00.000Z') };
          store.set(args.where.reserva_id, next as Awaited<ReturnType<typeof autorizarPagoDemo>>);
          return next as Awaited<ReturnType<typeof autorizarPagoDemo>>;
        }),
      },
    },
  };
}

describe('calcularCotizacionDemo', () => {
  it('usa tarifa fija cuando no hay coordenadas confiables', () => {
    const cotizacion = calcularCotizacionDemo({});

    expect(cotizacion.monto).toBe('75.00');
    expect(cotizacion.etiqueta).toBe('S/ 75.00');
    expect(cotizacion.fuente).toBe('tarifario_demo');
  });

  it('F8: pondera la tarifa por categoría de vehículo (van x1.40, sedán x1.00)', () => {
    const base = calcularCotizacionDemo({});
    const sedan = calcularCotizacionDemo({ vehiculoPreferencia: 'sedan' });
    const van = calcularCotizacionDemo({ vehiculoPreferencia: 'van' });
    const desconocido = calcularCotizacionDemo({ vehiculoPreferencia: 'helicoptero' });

    expect(sedan.monto).toBe(base.monto);
    expect(van.monto).toBe('105.00'); // 75 * 1.40
    expect(desconocido.monto).toBe(base.monto); // categoría rara no rompe la tarifa
  });

  it('F8: el multiplicador también aplica sobre coordenadas y respeta el redondeo', () => {
    const coords = {
      origenLat: -12.0231,
      origenLng: -77.112,
      destinoLat: -12.1196,
      destinoLng: -77.0365,
    };
    const base = calcularCotizacionDemo(coords);
    const camioneta = calcularCotizacionDemo({ ...coords, vehiculoPreferencia: 'camioneta' });

    expect(camioneta.montoDecimal.toNumber()).toBeGreaterThan(base.montoDecimal.toNumber());
    expect((camioneta.montoDecimal.toNumber() * 2) % 1).toBe(0); // redondeo a 0.50
  });

  it('calcula con coordenadas, factor de ruta y redondeo a 0.50', () => {
    const cotizacion = calcularCotizacionDemo({
      origenLat: -12.0231,
      origenLng: -77.112,
      destinoLat: -12.1196,
      destinoLng: -77.0365,
    });

    expect(Number(cotizacion.monto)).toBeGreaterThan(15);
    expect(Number(cotizacion.monto) * 2).toBe(Math.round(Number(cotizacion.monto) * 2));
    expect(cotizacion.fuente).toBe('coordenadas_demo');
  });

  it('cae al tarifario demo si las coordenadas salen del rango terrestre', () => {
    const cotizacion = calcularCotizacionDemo({
      origenLat: 999,
      origenLng: -77.112,
      destinoLat: -12.1196,
      destinoLng: -77.0365,
    });

    expect(cotizacion.monto).toBe('75.00');
    expect(cotizacion.fuente).toBe('tarifario_demo');
    expect(cotizacion.distanciaKm).toBeNull();
  });

  it('respeta la tarifa mínima para trayectos muy cortos', () => {
    const cotizacion = calcularCotizacionDemo({
      origenLat: -12.0231,
      origenLng: -77.112,
      destinoLat: -12.02311,
      destinoLng: -77.11201,
    });

    expect(cotizacion.monto).toBe('15.00');
    expect(cotizacion.fuente).toBe('coordenadas_demo');
  });
});

describe('autorizarPagoDemo', () => {
  it('autoriza app_pago con pasarela demo', async () => {
    const { db } = fakeDb();
    const pago = await autorizarPagoDemo(
      {
        reservaId: 'reserva-1',
        tenantId: 'tenant-1',
        tipoPago: TipoPago.app_pago,
        monto: '63.50',
        now: new Date('2026-06-01T12:00:00.000Z'),
      },
      db,
    );

    expect(pago.estado).toBe(EstadoPago.autorizado);
    expect(pago.proveedor_demo).toBe('pasarela_demo');
    expect(pago.autorizacion).toMatch(/^AUT-[0-9A-F]{6}$/u);
  });

  it('deja efectivo por cobrar sin autorización', async () => {
    const { db } = fakeDb();
    const pago = await autorizarPagoDemo(
      {
        reservaId: 'reserva-2',
        tenantId: 'tenant-1',
        tipoPago: TipoPago.efectivo,
        monto: new Prisma.Decimal('45.00'),
      },
      db,
    );

    expect(pago.estado).toBe(EstadoPago.por_cobrar);
    expect(pago.proveedor_demo).toBe('efectivo_en_unidad');
    expect(pago.autorizacion).toBeNull();
  });

  it('autoriza créditos hotel/empresa sin confundirlos con autorización de pasarela', async () => {
    const { db } = fakeDb();
    const hotel = await autorizarPagoDemo(
      {
        reservaId: 'reserva-hotel',
        tenantId: 'tenant-1',
        tipoPago: TipoPago.voucher_hotel,
        monto: '75.00',
      },
      db,
    );
    const empresa = await autorizarPagoDemo(
      {
        reservaId: 'reserva-empresa',
        tenantId: 'tenant-1',
        tipoPago: TipoPago.factura_empresa,
        monto: '90.00',
      },
      db,
    );

    expect(hotel).toMatchObject({
      estado: EstadoPago.autorizado,
      proveedor_demo: 'credito_hotel_demo',
      autorizacion: null,
    });
    expect(empresa).toMatchObject({
      estado: EstadoPago.autorizado,
      proveedor_demo: 'credito_empresa_demo',
      autorizacion: null,
    });
  });

  it('rechaza montos cero o negativos antes de persistir', async () => {
    const { db } = fakeDb();

    await expect(
      autorizarPagoDemo(
        {
          reservaId: 'reserva-monto-malo',
          tenantId: 'tenant-1',
          tipoPago: TipoPago.app_pago,
          monto: '0.00',
        },
        db,
      ),
    ).rejects.toThrow('mayor a cero');
  });
});

describe('cerrarPagoDemo', () => {
  it('F6: app_pago + responsable_pago=pasajero → por_cobrar (el pasajero paga desde /p/[token])', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-3', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );

    const pago = await cerrarPagoDemo(
      { reservaId: 'reserva-3', responsablePago: 'pasajero', now: new Date('2026-06-01T13:00:00.000Z') },
      db,
    );

    expect(pago?.estado).toBe(EstadoPago.por_cobrar);
    expect(pago?.capturado_en).toBeNull();
  });

  it('F6: efectivo + responsable_pago=pasajero → por_cobrar', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-efectivo', tenantId: 'tenant-1', tipoPago: TipoPago.efectivo, monto: '45.00' },
      db,
    );

    const pago = await cerrarPagoDemo(
      { reservaId: 'reserva-efectivo', responsablePago: 'pasajero' },
      db,
    );

    expect(pago?.estado).toBe(EstadoPago.por_cobrar);
    expect(pago?.capturado_en).toBeNull();
  });

  it('manda voucher hotel a liquidación (hotel/empresa siempre → por_liquidar)', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-4', tenantId: 'tenant-1', tipoPago: TipoPago.voucher_hotel, monto: '75.00' },
      db,
    );

    const pago = await cerrarPagoDemo({ reservaId: 'reserva-4', responsablePago: 'hotel' }, db);

    expect(pago?.estado).toBe(EstadoPago.por_liquidar);
    expect(pago?.capturado_en).toBeNull();
  });

  it('factura empresa + responsable=empresa → por_liquidar', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-factura', tenantId: 'tenant-1', tipoPago: TipoPago.factura_empresa, monto: '90.00' },
      db,
    );

    const empresa = await cerrarPagoDemo({ reservaId: 'reserva-factura', responsablePago: 'empresa' }, db);

    expect(empresa?.estado).toBe(EstadoPago.por_liquidar);
    expect(empresa?.capturado_en).toBeNull();
  });

  it('devuelve null si no hay pago que cerrar', async () => {
    const { db } = fakeDb();

    await expect(cerrarPagoDemo({ reservaId: 'reserva-sin-pago' }, db)).resolves.toBeNull();
  });

  it('cierre repetido no retrocede un pago ya capturado', async () => {
    const { db, store } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-idem', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );
    // Simular que el pasajero ya pagó
    const existing = store.get('reserva-idem')!;
    store.set('reserva-idem', {
      ...existing,
      estado: EstadoPago.capturado,
      capturado_en: new Date('2026-06-01T14:00:00.000Z'),
    } as typeof existing);

    const pago = await cerrarPagoDemo({ reservaId: 'reserva-idem', responsablePago: 'pasajero' }, db);

    expect(pago?.estado).toBe(EstadoPago.capturado);
    // update no debe haber sido llamado (devuelve el existente)
    expect(db.pagos.update).not.toHaveBeenCalled();
  });

  it('cierre repetido no retrocede un pago ya por_liquidar', async () => {
    const { db, store } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-idem2', tenantId: 'tenant-1', tipoPago: TipoPago.voucher_hotel, monto: '75.00' },
      db,
    );
    // Simular que ya fue cerrado a por_liquidar
    const existing = store.get('reserva-idem2')!;
    store.set('reserva-idem2', {
      ...existing,
      estado: EstadoPago.por_liquidar,
    } as typeof existing);

    const pago = await cerrarPagoDemo({ reservaId: 'reserva-idem2', responsablePago: 'hotel' }, db);

    expect(pago?.estado).toBe(EstadoPago.por_liquidar);
  });

  it('responsablePago null/undefined fail-safe a pasajero → por_cobrar', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-legacy', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '60.00' },
      db,
    );

    const pago = await cerrarPagoDemo({ reservaId: 'reserva-legacy' }, db);

    expect(pago?.estado).toBe(EstadoPago.por_cobrar);
  });
});

describe('capturarPagoPasajeroDemo', () => {
  it('pagar_app en por_cobrar → capturado con pasarela demo', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-cap1', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );
    await cerrarPagoDemo({ reservaId: 'reserva-cap1', responsablePago: 'pasajero' }, db);

    const result = await capturarPagoPasajeroDemo(
      { reservaId: 'reserva-cap1', accion: 'pagar_app', now: new Date('2026-06-01T15:00:00.000Z') },
      db,
    );

    expect(result.kind).toBe('capturado');
    if (result.kind === 'capturado') {
      expect(result.pago.estado).toBe(EstadoPago.capturado);
      expect(result.pago.capturado_en?.toISOString()).toBe('2026-06-01T15:00:00.000Z');
      expect(result.pago.proveedor_demo).toBe('pasarela_demo');
      expect(result.pago.autorizacion).toMatch(/^CAP-[0-9A-F]{6}$/u);
    }
  });

  it('confirmar_efectivo en por_cobrar → capturado sin pasarela', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-cap2', tenantId: 'tenant-1', tipoPago: TipoPago.efectivo, monto: '45.00' },
      db,
    );
    await cerrarPagoDemo({ reservaId: 'reserva-cap2', responsablePago: 'pasajero' }, db);

    const result = await capturarPagoPasajeroDemo(
      { reservaId: 'reserva-cap2', accion: 'confirmar_efectivo' },
      db,
    );

    expect(result.kind).toBe('capturado');
    if (result.kind === 'capturado') {
      expect(result.pago.estado).toBe(EstadoPago.capturado);
      expect(result.pago.proveedor_demo).toBe('efectivo_confirmado_pasajero');
    }
  });

  it('ya capturado → ya_capturado (idempotente)', async () => {
    const { db, store } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-cap3', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );
    const existing = store.get('reserva-cap3')!;
    store.set('reserva-cap3', { ...existing, estado: EstadoPago.capturado } as typeof existing);

    const result = await capturarPagoPasajeroDemo(
      { reservaId: 'reserva-cap3', accion: 'pagar_app' },
      db,
    );

    expect(result.kind).toBe('ya_capturado');
  });

  it('pago no en por_cobrar → no_cobrable', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-cap4', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );
    // pago en estado autorizado, no por_cobrar

    const result = await capturarPagoPasajeroDemo(
      { reservaId: 'reserva-cap4', accion: 'pagar_app' },
      db,
    );

    expect(result.kind).toBe('no_cobrable');
  });

  it('sin pago → no_pago', async () => {
    const { db } = fakeDb();

    const result = await capturarPagoPasajeroDemo(
      { reservaId: 'reserva-inexistente', accion: 'pagar_app' },
      db,
    );

    expect(result.kind).toBe('no_pago');
  });
});

describe('anularPagoDemo', () => {
  it('anula un pago autorizado → rechazado', async () => {
    const { db } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-anu1', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );

    const pago = await anularPagoDemo('reserva-anu1', db);

    expect(pago?.estado).toBe(EstadoPago.rechazado);
  });

  it('no anula un pago ya capturado', async () => {
    const { db, store } = fakeDb();
    await autorizarPagoDemo(
      { reservaId: 'reserva-anu2', tenantId: 'tenant-1', tipoPago: TipoPago.app_pago, monto: '75.00' },
      db,
    );
    const existing = store.get('reserva-anu2')!;
    store.set('reserva-anu2', { ...existing, estado: EstadoPago.capturado } as typeof existing);

    const pago = await anularPagoDemo('reserva-anu2', db);

    expect(pago?.estado).toBe(EstadoPago.capturado);
  });

  it('devuelve null si no hay pago', async () => {
    const { db } = fakeDb();

    expect(await anularPagoDemo('reserva-no-existe', db)).toBeNull();
  });
});

describe('serializarPagoDemo', () => {
  it('expone monto y copy humano consistente', () => {
    const pago = serializarPagoDemo({
      tipoPago: TipoPago.factura_empresa,
      pago: {
        tipo_pago: TipoPago.factura_empresa,
        estado: EstadoPago.autorizado,
        monto: new Prisma.Decimal('90.00'),
        moneda: 'PEN',
      },
    });

    expect(pago?.etiqueta).toBe('S/ 90.00 · Crédito empresa autorizado');
    expect(estadoPagoHumano(null)).toBe('Pago por confirmar');
  });

  it('serializa una cotización histórica sin fila de pago como pendiente', () => {
    const pago = serializarPagoDemo({
      tipoPago: TipoPago.efectivo,
      cotizacionMonto: new Prisma.Decimal('75.00'),
      cotizacionMoneda: 'PEN',
    });

    expect(pago).toMatchObject({
      metodo: TipoPago.efectivo,
      estado: EstadoPago.pendiente,
      etiqueta: 'S/ 75.00 · Pago por confirmar',
    });
  });

  it('devuelve null para reservas legacy sin pago ni cotización', () => {
    expect(serializarPagoDemo({ tipoPago: TipoPago.efectivo })).toBeNull();
  });

  it('F6: por_cobrar + app_pago muestra label correcto', () => {
    const label = estadoPagoHumano({
      tipo_pago: TipoPago.app_pago,
      estado: EstadoPago.por_cobrar,
      monto: new Prisma.Decimal('75.00'),
      moneda: 'PEN',
    });

    expect(label).toBe('Pendiente de pago por app');
  });

  it('F6: por_cobrar + efectivo muestra label correcto', () => {
    const label = estadoPagoHumano({
      tipo_pago: TipoPago.efectivo,
      estado: EstadoPago.por_cobrar,
      monto: new Prisma.Decimal('45.00'),
      moneda: 'PEN',
    });

    expect(label).toBe('Pendiente de pago en efectivo');
  });
});
