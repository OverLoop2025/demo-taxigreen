import { NextResponse } from 'next/server';
import { getPassengerTripByToken } from '@/lib/pasajero';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPassengerTripByToken(token);

  if (!data) {
    return NextResponse.json({ error: 'token_no_encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}
