import { recordAudit } from '@taxigreen/auditoria';
import { createVoucherToken, renderQRtoPNG } from '@taxigreen/voucher';
import { NextResponse } from 'next/server';
import { findReservaByPublicId } from '@/lib/reservas';
import { prisma } from '@taxigreen/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reserva = await findReservaByPublicId(id);
  if (!reserva) {
    return NextResponse.json({ error: 'reserva_no_encontrada' }, { status: 404 });
  }

  const token = createVoucherToken({
    reservaId: reserva.id,
    codigoPublico: reserva.voucher_codigo,
  });
  const png = await renderQRtoPNG(token);

  await prisma.reservas.update({
    where: { id: reserva.id },
    data: {
      voucher_qr_payload: token,
      voucher_emitido_en: new Date(),
    },
  });
  await recordAudit({
    actor: { tipo: 'sistema', id: 'api:voucher:qr' },
    action: 'voucher_qr_emitido',
    target: { table: 'reservas', id: reserva.id },
    tenantId: reserva.tenant_id,
    payload: { voucher_codigo: reserva.voucher_codigo },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      'Cache-Control': 'public, max-age=30, s-maxage=30',
      'Content-Type': 'image/png',
      'x-voucher-token': token,
    },
  });
}
