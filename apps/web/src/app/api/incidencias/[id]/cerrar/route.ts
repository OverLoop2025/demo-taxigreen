import { recordAudit } from '@taxigreen/auditoria';
import { EstadoIncidencia, Prisma, prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { timelineArray } from '@/lib/incidencias';
import { broadcastReservaIncidencia } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  token_pasajero: z.string().min(8),
  opcion_entrega: z.enum(['hotel_hoy', 'oficina_manana']).optional().nullable(),
  resuelto: z.boolean().default(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'cierre_invalido' }, { status: 400 });
  }

  const { id } = await params;
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const incidencia = await tx.incidencias.findFirst({
      where: {
        id,
        deleted_at: null,
        reserva: {
          token_pasajero: parsed.data.token_pasajero,
          deleted_at: null,
        },
      },
      select: {
        id: true,
        tenant_id: true,
        reserva_id: true,
        tipologia: true,
        descripcion: true,
        timeline: true,
        created_at: true,
        reserva: {
          select: {
            voucher_codigo: true,
          },
        },
      },
    });

    if (!incidencia) return null;

    const nextTimeline: Prisma.InputJsonValue[] = [
      ...timelineArray(incidencia.timeline),
      {
        ts: now.toISOString(),
        actor: 'pasajero',
        action: parsed.data.resuelto ? 'incidencia_cerrada_pasajero' : 'incidencia_reabierta_pasajero',
        opcion_entrega: parsed.data.opcion_entrega ?? null,
        resuelto: parsed.data.resuelto,
      },
    ];

    return tx.incidencias.update({
      where: { id: incidencia.id },
      data: {
        estado: parsed.data.resuelto ? EstadoIncidencia.cerrada : EstadoIncidencia.escalada,
        timeline: nextTimeline,
        tr_seg: parsed.data.resuelto
          ? Math.max(0, Math.round((now.getTime() - incidencia.created_at.getTime()) / 1000))
          : null,
        closed_at: parsed.data.resuelto ? now : null,
      },
      select: {
        id: true,
        tenant_id: true,
        reserva_id: true,
        tipologia: true,
        estado: true,
        descripcion: true,
        reserva: {
          select: {
            voucher_codigo: true,
          },
        },
      },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: 'incidencia_no_encontrada' }, { status: 404 });
  }

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_publico' },
    action: parsed.data.resuelto ? 'incidencia_objeto_olvidado_cerrada' : 'incidencia_objeto_olvidado_escalada',
    target: { table: 'incidencias', id: updated.id },
    tenantId: updated.tenant_id,
    req: { headers: request.headers },
    payload: {
      reserva_id: updated.reserva_id,
      voucher_codigo: updated.reserva.voucher_codigo,
      opcion_entrega: parsed.data.opcion_entrega ?? null,
      estado: updated.estado,
    },
  });

  const broadcast = await broadcastReservaIncidencia({
    reservaId: updated.reserva_id,
    incidenciaId: updated.id,
    estado: updated.estado,
    tipologia: updated.tipologia,
    descripcion: updated.descripcion,
  });

  return NextResponse.json({ ok: true, incidencia: updated, broadcast });
}
