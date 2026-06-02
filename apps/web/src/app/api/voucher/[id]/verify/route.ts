import { recordAudit } from '@taxigreen/auditoria';
import { verifyVoucherToken } from '@taxigreen/voucher';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findReservaByPublicId } from '@/lib/reservas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(20),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reserva = await findReservaByPublicId(id);
  if (!reserva) {
    return NextResponse.json({ error: 'reserva_no_encontrada' }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 400 });
  }

  const verification = verifyVoucherToken(parsed.data.token);
  const matchesReserva =
    verification.ok &&
    verification.payload.reserva_id === reserva.id &&
    verification.payload.codigo_publico === reserva.voucher_codigo;

  await recordAudit({
    actor: { tipo: 'sistema', id: 'api:voucher:verify' },
    action: matchesReserva ? 'voucher_qr_verificado' : 'voucher_qr_rechazado',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    payload: {
      voucher_codigo: reserva.voucher_codigo,
      resultado: matchesReserva ? 'ok' : verification.ok ? 'mismatch' : verification.reason,
    },
  });

  if (!matchesReserva) {
    return NextResponse.json({ ok: false, error: 'token_invalido' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    reserva: {
      id: reserva.id,
      voucher_codigo: reserva.voucher_codigo,
      origen_texto: reserva.origen_texto,
      destino_texto: reserva.destino_texto,
      punto_encuentro: reserva.punto_encuentro,
    },
  });
}
