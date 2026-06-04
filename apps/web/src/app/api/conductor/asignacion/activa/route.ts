import { NextResponse } from 'next/server';
import { serializeConductorAsignacion } from '@/lib/conductor-asignacion';
import { findActiveAsignacionForConductor } from '@/lib/conductor-asignacion-repository';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireConductorSession(request: Request) {
  const bearer = bearerTokenFromRequest(request);
  return bearer ? verifyConductorToken(bearer) : null;
}

// Devuelve la asignación vigente del conductor autenticado (o null si no tiene).
// La app la consulta al abrir el home para mostrar el viaje sin esperar un
// broadcast Realtime; el push sólo despierta la app cerrada (opcional en demo).
export async function GET(request: Request) {
  const session = await requireConductorSession(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const reserva = await findActiveAsignacionForConductor(session);
  if (!reserva) {
    return NextResponse.json({ asignacion: null });
  }

  return NextResponse.json({ asignacion: serializeConductorAsignacion(reserva) });
}
