import { recordAudit } from '@taxigreen/auditoria';
import { EstadoReserva, EstadoViaje, prisma, TipoComprobante } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prepararComprobanteDemo } from '@/lib/comprobantes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  tipo: z.nativeEnum(TipoComprobante).default(TipoComprobante.boleta),
  dni: z.string().regex(/^\d{8}$/).nullable().optional(),
  ruc: z.string().regex(/^\d{11}$/).nullable().optional(),
  nombre: z.string().trim().max(160).nullable().optional(),
});

function viajeTerminado(reserva: {
  estado: EstadoReserva;
  viajes: Array<{ estado: EstadoViaje }>;
}) {
  return reserva.estado === EstadoReserva.por_liquidar || reserva.viajes[0]?.estado === EstadoViaje.finalizado;
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'comprobante_invalido' }, { status: 400 });
  }

  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      id: true,
      tenant_id: true,
      voucher_codigo: true,
      pasajero_nombre: true,
      tipo_pago: true,
      responsable_pago: true,
      estado: true,
      cotizacion_monto: true,
      pago: {
        select: {
          monto: true,
          estado: true,
        },
      },
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

  if (!viajeTerminado(reserva)) {
    return NextResponse.json({ error: 'viaje_no_terminado' }, { status: 409 });
  }

  // F6: si paga el pasajero, primero paga y después recibe comprobante.
  if (
    reserva.responsable_pago === 'pasajero' &&
    reserva.pago &&
    reserva.pago.estado !== 'capturado'
  ) {
    return NextResponse.json({ error: 'pago_pendiente' }, { status: 409 });
  }

  const tipo = parsed.data.tipo;
  const result = await prisma.$transaction(async (tx) => {
    await tx.reservas.update({
      where: { id: reserva.id },
      data: {
        pasajero_dni: parsed.data.dni ?? undefined,
        pasajero_ruc: parsed.data.ruc ?? undefined,
        pasajero_nombre: parsed.data.nombre?.trim() || reserva.pasajero_nombre,
      },
    });

    return prepararComprobanteDemo(tx, {
      tenantId: reserva.tenant_id,
      reservaId: reserva.id,
      tipoPago: reserva.tipo_pago,
      tipo,
      pago: reserva.pago,
      cotizacionMonto: reserva.cotizacion_monto,
    });
  });
  const comprobante = result.comprobante;

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_publico' },
    action: 'comprobante_pasajero_preparado',
    target: { table: 'comprobantes', id: comprobante.id },
    tenantId: reserva.tenant_id,
    req: { headers: request.headers },
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      tipo: comprobante.tipo,
      serie: comprobante.serie,
      correlativo: comprobante.correlativo,
      monto: comprobante.monto.toFixed(2),
      fuente_monto: result.montoFuente,
      creado: result.created,
      dni: parsed.data.dni ?? null,
      ruc: parsed.data.ruc ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    comprobante: {
      ...comprobante,
      monto: comprobante.monto.toFixed(2),
    },
    pdf_url: `/api/pasajero/${token}/comprobante/pdf`,
  });
}
