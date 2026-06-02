import { NextResponse } from 'next/server';
import { serializeConductorAsignacion } from '@/lib/conductor-asignacion';
import { findAsignacionForConductor } from '@/lib/conductor-asignacion-repository';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireConductorSession(request: Request) {
  const bearer = bearerTokenFromRequest(request);
  return bearer ? verifyConductorToken(bearer) : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireConductorSession(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const reserva = await findAsignacionForConductor(session, id);

  if (!reserva) {
    return NextResponse.json({ error: 'asignacion_no_encontrada' }, { status: 404 });
  }

  return NextResponse.json(serializeConductorAsignacion(reserva));
}
