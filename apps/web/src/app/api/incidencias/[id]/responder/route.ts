import { recordAudit } from '@taxigreen/auditoria';
import { EstadoIncidencia, Prisma, prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';
import { timelineArray } from '@/lib/incidencias';
import { broadcastReservaIncidencia } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  respuesta: z.enum(['encontrado', 'no_visto', 'revisar']),
});

function estadoParaRespuesta(respuesta: z.infer<typeof schema>['respuesta']) {
  if (respuesta === 'encontrado') return EstadoIncidencia.en_resolucion;
  if (respuesta === 'no_visto') return EstadoIncidencia.escalada;
  return EstadoIncidencia.abierta;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = bearerTokenFromRequest(request);
  const session = bearer ? await verifyConductorToken(bearer) : null;
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'respuesta_invalida' }, { status: 400 });
  }

  const { id } = await params;
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const incidencia = await tx.incidencias.findFirst({
      where: {
        id,
        tenant_id: session.tenantId,
        deleted_at: null,
        // Un caso ya cerrado/resuelto no se reabre por una respuesta tardía del
        // conductor (app con estado viejo). Queda fuera del match → 404, sin
        // revertir el estado terminal que fijó el pasajero.
        estado: { notIn: [EstadoIncidencia.cerrada, EstadoIncidencia.resuelta] },
        reserva: {
          conductor_id: session.conductorId,
        },
      },
      select: {
        id: true,
        tenant_id: true,
        reserva_id: true,
        estado: true,
        descripcion: true,
        timeline: true,
        created_at: true,
        tpr_seg: true,
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
        actor: 'conductor',
        actor_id: session.conductorId,
        action: `objeto_${parsed.data.respuesta}`,
        respuesta: parsed.data.respuesta,
      },
    ];

    return tx.incidencias.update({
      where: { id: incidencia.id },
      data: {
        estado: estadoParaRespuesta(parsed.data.respuesta),
        timeline: nextTimeline,
        tpr_seg:
          incidencia.tpr_seg ??
          Math.max(0, Math.round((now.getTime() - incidencia.created_at.getTime()) / 1000)),
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
    actor: { tipo: 'conductor', id: session.conductorId },
    action: 'incidencia_objeto_olvidado_respondida',
    target: { table: 'incidencias', id: updated.id },
    tenantId: updated.tenant_id,
    req: { headers: request.headers },
    payload: {
      reserva_id: updated.reserva_id,
      voucher_codigo: updated.reserva.voucher_codigo,
      respuesta: parsed.data.respuesta,
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
