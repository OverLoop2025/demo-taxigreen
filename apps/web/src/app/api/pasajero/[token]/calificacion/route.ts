import { recordAudit } from '@taxigreen/auditoria';
import { prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// El comentario es SIEMPRE opcional (decisión de producto): si un eje queda en 3 o
// menos, la UI invita a comentar pero no obliga. No se rechaza por falta de motivo.
const schema = z.object({
  servicio: z.number().int().min(1).max(5),
  conductor: z.number().int().min(1).max(5),
  unidad: z.number().int().min(1).max(5),
  motivo: z.string().trim().max(240).optional().nullable(),
  comentario: z.string().trim().max(700).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'calificacion_invalida' }, { status: 400 });
  }

  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      id: true,
      tenant_id: true,
      voucher_codigo: true,
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const calificacion = {
    ...parsed.data,
    motivo: parsed.data.motivo?.trim() || null,
    comentario: parsed.data.comentario?.trim() || null,
    creadoEn: new Date().toISOString(),
    fuente: 'pasajero_link',
  };

  await prisma.reservas.update({
    where: { id: reserva.id },
    data: { calificacion },
  });

  await recordAudit({
    actor: { tipo: 'pasajero', id: 'link_publico' },
    action: 'reserva_calificada',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    req: { headers: request.headers },
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      servicio: parsed.data.servicio,
      conductor: parsed.data.conductor,
      unidad: parsed.data.unidad,
      motivo: calificacion.motivo,
    },
  });

  return NextResponse.json({ ok: true, calificacion });
}
