import { recordAudit } from '@taxigreen/auditoria';
import { EstadoReserva, EstadoViaje, prisma } from '@taxigreen/database';
import { capturarPagoPasajeroDemo } from '@taxigreen/pagos';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prepararComprobanteDemo, tipoComprobanteParaReserva } from '@/lib/comprobantes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  accion: z.enum(['pagar_app', 'confirmar_efectivo']),
  // Marca elegida en la pasarela demo (solo etiqueta; el monto nunca viene del cliente).
  metodo: z.enum(['tarjeta', 'yape', 'plin', 'paypal']).optional(),
});

// El pasajero paga su viaje desde /p/[token] DESPUÉS de finalizar (F6).
// El monto jamás viene del cliente: la única fuente es pagos.monto.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'pago_invalido' }, { status: 400 });
  }

  const { token } = await params;
  const accion = parsed.data.accion;

  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      id: true,
      tenant_id: true,
      voucher_codigo: true,
      estado: true,
      tipo_pago: true,
      responsable_pago: true,
      requiere_factura: true,
      pasajero_ruc: true,
      cotizacion_monto: true,
      pago: { select: { id: true, estado: true, tipo_pago: true } },
      viajes: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { estado: true },
      },
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  if (reserva.responsable_pago !== 'pasajero') {
    return NextResponse.json({ error: 'pago_cubierto_por_convenio' }, { status: 409 });
  }

  const viajeTerminado =
    reserva.estado === EstadoReserva.por_liquidar ||
    reserva.estado === EstadoReserva.finalizada ||
    reserva.viajes[0]?.estado === EstadoViaje.finalizado;
  if (!viajeTerminado) {
    return NextResponse.json({ error: 'viaje_no_terminado' }, { status: 409 });
  }

  // El pasajero decide al final cómo paga: si elige una marca digital (tarjeta/
  // Yape/Plin/PayPal) el método pasa a `app_pago` en la captura; si confirma
  // efectivo, se queda en efectivo. No bloqueamos por el método inicial.
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const captura = await capturarPagoPasajeroDemo(
      { reservaId: reserva.id, accion, metodo: parsed.data.metodo ?? null, now },
      tx,
    );
    if (captura.kind !== 'capturado') return { captura, comprobante: null };

    // Pagas → recibes comprobante: recién aquí se prepara (F6 §7.3).
    const comprobanteResult = await prepararComprobanteDemo(tx, {
      tenantId: reserva.tenant_id,
      reservaId: reserva.id,
      tipoPago: reserva.tipo_pago,
      tipo: tipoComprobanteParaReserva({
        responsablePago: reserva.responsable_pago,
        tipoPago: reserva.tipo_pago,
        requiereFactura: reserva.requiere_factura,
        pasajeroRuc: reserva.pasajero_ruc,
      }),
      pago: captura.pago,
      cotizacionMonto: reserva.cotizacion_monto,
    });

    return { captura, comprobante: comprobanteResult.comprobante };
  });

  if (result.captura.kind === 'no_pago') {
    return NextResponse.json({ error: 'pago_no_encontrado' }, { status: 404 });
  }

  if (result.captura.kind === 'no_cobrable') {
    return NextResponse.json(
      { error: 'pago_no_cobrable', estado: result.captura.estado },
      { status: 409 },
    );
  }

  const pago = result.captura.pago;
  const yaPagado = result.captura.kind === 'ya_capturado';

  if (!yaPagado) {
    await recordAudit({
      actor: { tipo: 'pasajero', id: 'link_publico' },
      action: 'pago_pasajero_capturado_demo',
      target: { table: 'pagos', id: pago.id },
      tenantId: reserva.tenant_id,
      req: { headers: request.headers },
      payload: {
        reserva_id: reserva.id,
        voucher_codigo: reserva.voucher_codigo,
        accion,
        tipo_pago: pago.tipo_pago,
        estado: pago.estado,
        monto: pago.monto.toFixed(2),
        moneda: pago.moneda,
        autorizacion: pago.autorizacion,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    yaPagado,
    pago: {
      estado: pago.estado,
      tipo_pago: pago.tipo_pago,
      monto: pago.monto.toFixed(2),
      moneda: pago.moneda,
      autorizacion: pago.autorizacion,
      capturadoEn: pago.capturado_en?.toISOString() ?? null,
    },
    comprobante: result.comprobante
      ? {
          id: result.comprobante.id,
          tipo: result.comprobante.tipo,
          serie: result.comprobante.serie,
          correlativo: result.comprobante.correlativo,
          monto: result.comprobante.monto.toFixed(2),
        }
      : null,
  });
}
