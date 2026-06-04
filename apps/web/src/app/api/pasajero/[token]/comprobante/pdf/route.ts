import { prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reserva = await prisma.reservas.findFirst({
    where: { token_pasajero: token, deleted_at: null },
    select: {
      id: true,
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  const location = `/api/comprobantes/${reserva.id}/pdf?redirect=signed`;
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
    },
  });
}
