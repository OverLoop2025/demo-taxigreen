import { recordAudit } from '@taxigreen/auditoria';
import { EstadoComprobante, prisma, TipoComprobante } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  tipo: z.nativeEnum(TipoComprobante).default(TipoComprobante.boleta),
  dni: z.string().regex(/^\d{8}$/).nullable().optional(),
  ruc: z.string().regex(/^\d{11}$/).nullable().optional(),
  nombre: z.string().trim().max(160).nullable().optional(),
});

function serieForTipo(tipo: TipoComprobante) {
  if (tipo === TipoComprobante.factura) return 'F001';
  if (tipo === TipoComprobante.ticket) return 'T001';
  return 'B001';
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
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const tipo = parsed.data.tipo;
  const serie = serieForTipo(tipo);
  const comprobante = await prisma.$transaction(async (tx) => {
    await tx.reservas.update({
      where: { id: reserva.id },
      data: {
        pasajero_dni: parsed.data.dni ?? undefined,
        pasajero_ruc: parsed.data.ruc ?? undefined,
        pasajero_nombre: parsed.data.nombre?.trim() || reserva.pasajero_nombre,
      },
    });

    const existing = await tx.comprobantes.findFirst({
      where: {
        reserva_id: reserva.id,
        tipo,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        tipo: true,
        serie: true,
        correlativo: true,
        estado: true,
      },
    });

    if (existing) return existing;

    const latest = await tx.comprobantes.findFirst({
      where: {
        tipo,
        serie,
      },
      orderBy: { correlativo: 'desc' },
      select: { correlativo: true },
    });

    return tx.comprobantes.create({
      data: {
        tenant_id: reserva.tenant_id,
        reserva_id: reserva.id,
        tipo,
        serie,
        correlativo: (latest?.correlativo ?? 0) + 1,
        monto: 75,
        estado: EstadoComprobante.pendiente,
      },
      select: {
        id: true,
        tipo: true,
        serie: true,
        correlativo: true,
        estado: true,
      },
    });
  });

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
      dni: parsed.data.dni ?? null,
      ruc: parsed.data.ruc ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    comprobante,
    pdf_url: `/api/pasajero/${token}/comprobante/pdf`,
  });
}
