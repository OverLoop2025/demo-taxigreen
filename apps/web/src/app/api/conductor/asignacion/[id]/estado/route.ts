import { NextResponse } from 'next/server';
import { recordAudit } from '@taxigreen/auditoria';
import { EstadoViaje, Prisma, prisma } from '@taxigreen/database';
import { cerrarPagoDemo } from '@taxigreen/pagos';
import { z } from 'zod';
import {
  estadoReservaParaViaje,
  puedeIniciarRuta,
  serializeConductorAsignacion,
  timestampFieldForEstado,
  validarTransicionViaje,
} from '@/lib/conductor-asignacion';
import { findAsignacionForConductor } from '@/lib/conductor-asignacion-repository';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';
import { prepararComprobanteDemo, tipoComprobanteParaReserva } from '@/lib/comprobantes';
import { broadcastReservaEstado } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  estado_nuevo: z.nativeEnum(EstadoViaje),
});

function tripUpdateData(estadoNuevo: EstadoViaje, now: Date): Prisma.viajesUpdateInput {
  const timestampField = timestampFieldForEstado(estadoNuevo);
  if (timestampField === 'inicio_en_camino') return { estado: estadoNuevo, inicio_en_camino: now };
  if (timestampField === 'llegada_punto') return { estado: estadoNuevo, llegada_punto: now };
  if (timestampField === 'pasajero_a_bordo') return { estado: estadoNuevo, pasajero_a_bordo: now };
  if (timestampField === 'finalizado_en') return { estado: estadoNuevo, finalizado_en: now };
  return { estado: estadoNuevo };
}

function serializePagoCierre(pago: Awaited<ReturnType<typeof cerrarPagoDemo>>) {
  if (!pago) return null;
  return {
    id: pago.id,
    tipo_pago: pago.tipo_pago,
    estado: pago.estado,
    monto: pago.monto.toFixed(2),
    moneda: pago.moneda,
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = bearerTokenFromRequest(request);
  const session = bearer ? await verifyConductorToken(bearer) : null;
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  const { id } = await params;
  const estadoNuevo = parsed.data.estado_nuevo;
  const now = new Date();

  const transition = await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservas.findFirst({
      where: {
        id,
        tenant_id: session.tenantId,
        conductor_id: session.conductorId,
        deleted_at: null,
        conductor: {
          usuario: {
            id: session.userId,
            activo: true,
            deleted_at: null,
          },
        },
      },
      select: {
        id: true,
        tenant_id: true,
        voucher_codigo: true,
        tipo_viaje: true,
        tipo_pago: true,
        responsable_pago: true,
        requiere_factura: true,
        pasajero_ruc: true,
        cotizacion_monto: true,
        estado_abordaje: true,
        estado: true,
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
          },
        },
      },
    });

    if (!reserva) {
      return { kind: 'not_found' as const };
    }

    const viaje = reserva.viajes[0];
    if (!viaje) {
      return { kind: 'missing_trip' as const, voucherCodigo: reserva.voucher_codigo };
    }

    const validation = validarTransicionViaje(viaje.estado, estadoNuevo);
    if (!validation.ok) {
      return {
        kind: 'invalid_transition' as const,
        estadoActual: viaje.estado,
        estadoEsperado: validation.esperado,
      };
    }

    const estadoReserva = estadoReservaParaViaje(estadoNuevo);
    if (estadoNuevo === EstadoViaje.en_camino) {
      const gate = puedeIniciarRuta({
        tipoViaje: reserva.tipo_viaje,
        estadoAbordaje: reserva.estado_abordaje,
      });
      if (!gate.ok) {
        return {
          kind: 'counter_pendiente' as const,
          reservaId: reserva.id,
          voucherCodigo: reserva.voucher_codigo,
          estadoAbordaje: reserva.estado_abordaje,
        };
      }
    }

    await tx.viajes.update({
      where: { id: viaje.id },
      data: tripUpdateData(estadoNuevo, now),
    });
    await tx.reservas.update({
      where: { id: reserva.id },
      data: { estado: estadoReserva },
    });

    let cierreFinanciero:
      | {
          pago: ReturnType<typeof serializePagoCierre>;
          comprobante: {
            id: string;
            tipo: string;
            serie: string;
            correlativo: number;
            estado: string;
            monto: string;
          } | null;
          comprobanteCreado: boolean;
          montoFuente: string | null;
          requiereAccionPasajero: boolean;
        }
      | null = null;

    if (estadoNuevo === EstadoViaje.finalizado) {
      // F6: el cierre consulta responsable_pago — pasajero queda por_cobrar (paga
      // desde /p/[token]); empresa/hotel queda por_liquidar como siempre.
      const pago = await cerrarPagoDemo(
        { reservaId: reserva.id, responsablePago: reserva.responsable_pago, now },
        tx,
      );
      const pagoPayload = serializePagoCierre(pago);
      const requiereAccionPasajero = reserva.responsable_pago === 'pasajero';

      // F6: si paga el pasajero, el comprobante nace recién al capturar su pago
      // (pagas → recibes comprobante). Para convenio se prepara aquí, como siempre.
      const comprobanteResult = requiereAccionPasajero
        ? null
        : await prepararComprobanteDemo(tx, {
            tenantId: reserva.tenant_id,
            reservaId: reserva.id,
            tipoPago: reserva.tipo_pago,
            tipo: tipoComprobanteParaReserva({
              responsablePago: reserva.responsable_pago,
              tipoPago: reserva.tipo_pago,
              requiereFactura: reserva.requiere_factura,
              pasajeroRuc: reserva.pasajero_ruc,
            }),
            pago,
            cotizacionMonto: reserva.cotizacion_monto,
          });
      const comprobante = comprobanteResult?.comprobante ?? null;

      await tx.auditoria.create({
        data: {
          tenant_id: session.tenantId,
          actor_tipo: 'conductor',
          actor_id: session.conductorId,
          action: 'pago_demo_cerrado',
          target_table: pago ? 'pagos' : 'reservas',
          target_id: pago?.id ?? reserva.id,
          payload: {
            reserva_id: reserva.id,
            voucher_codigo: reserva.voucher_codigo,
            responsable_pago: reserva.responsable_pago,
            requiere_accion_pasajero: requiereAccionPasajero,
            pago: pagoPayload,
          } satisfies Prisma.InputJsonObject,
        },
      });

      if (comprobante) {
        await tx.auditoria.create({
          data: {
            tenant_id: session.tenantId,
            actor_tipo: 'sistema',
            actor_id: 'cierre_viaje',
            action: 'comprobante_preparado',
            target_table: 'comprobantes',
            target_id: comprobante.id,
            payload: {
              reserva_id: reserva.id,
              voucher_codigo: reserva.voucher_codigo,
              tipo: comprobante.tipo,
              serie: comprobante.serie,
              correlativo: comprobante.correlativo,
              estado: comprobante.estado,
              monto: comprobante.monto.toFixed(2),
              creado: comprobanteResult?.created ?? false,
              fuente_monto: comprobanteResult?.montoFuente ?? null,
            } satisfies Prisma.InputJsonObject,
          },
        });
      }

      cierreFinanciero = {
        pago: pagoPayload,
        comprobante: comprobante
          ? {
              id: comprobante.id,
              tipo: comprobante.tipo,
              serie: comprobante.serie,
              correlativo: comprobante.correlativo,
              estado: comprobante.estado,
              monto: comprobante.monto.toFixed(2),
            }
          : null,
        comprobanteCreado: comprobanteResult?.created ?? false,
        montoFuente: comprobanteResult?.montoFuente ?? null,
        requiereAccionPasajero,
      };
    }

    return {
      kind: 'updated' as const,
      reservaId: reserva.id,
      voucherCodigo: reserva.voucher_codigo,
      viajeId: viaje.id,
      estadoAnterior: viaje.estado,
      estadoNuevo,
      estadoReservaAnterior: reserva.estado,
      estadoReserva,
      cierreFinanciero,
    };
  });

  if (transition.kind === 'not_found') {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  if (transition.kind === 'missing_trip') {
    return NextResponse.json(
      { error: 'viaje_no_encontrado', voucher_codigo: transition.voucherCodigo },
      { status: 409 },
    );
  }

  if (transition.kind === 'invalid_transition') {
    return NextResponse.json(
      {
        error: 'transicion_invalida',
        estado_actual: transition.estadoActual,
        estado_esperado: transition.estadoEsperado,
      },
      { status: 409 },
    );
  }

  if (transition.kind === 'counter_pendiente') {
    await recordAudit({
      actor: { tipo: 'conductor', id: session.conductorId },
      action: 'driver_inicio_bloqueado_counter',
      target: { table: 'reservas', id },
      tenantId: session.tenantId,
      req: { headers: request.headers },
      payload: {
        reserva_id: transition.reservaId,
        voucher_codigo: transition.voucherCodigo,
        estado_abordaje: transition.estadoAbordaje,
      },
    });

    return NextResponse.json(
      {
        error: 'counter_pendiente',
        estado_abordaje: transition.estadoAbordaje,
      },
      { status: 409 },
    );
  }

  await recordAudit({
    actor: { tipo: 'conductor', id: session.conductorId },
    action: 'driver_estado_viaje_actualizado',
    target: { table: 'reservas', id },
    tenantId: session.tenantId,
    req: { headers: request.headers },
    payload: {
      reserva_id: transition.reservaId,
      voucher_codigo: transition.voucherCodigo,
      viaje_id: transition.viajeId,
      estado_viaje_anterior: transition.estadoAnterior,
      estado_viaje_nuevo: transition.estadoNuevo,
      estado_reserva_anterior: transition.estadoReservaAnterior,
      estado_reserva_nuevo: transition.estadoReserva,
      cierre_financiero: transition.cierreFinanciero,
    },
  });

  const broadcast = await broadcastReservaEstado({
    reservaId: transition.reservaId,
    viajeId: transition.viajeId,
    conductorId: session.conductorId,
    estadoReserva: transition.estadoReserva,
    estadoViaje: transition.estadoNuevo,
  });

  const updated = await findAsignacionForConductor(session, id);
  if (!updated) {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    broadcast,
    asignacion: serializeConductorAsignacion(updated),
  });
}
