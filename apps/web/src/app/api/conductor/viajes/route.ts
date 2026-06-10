import { NextResponse } from 'next/server';
import { serializeConductorViajeResumen } from '@/lib/conductor-asignacion';
import { findHistorialForConductor } from '@/lib/conductor-asignacion-repository';
import { bearerTokenFromRequest, verifyConductorToken } from '@/lib/conductor-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireConductorSession(request: Request) {
  const bearer = bearerTokenFromRequest(request);
  return bearer ? verifyConductorToken(bearer) : null;
}

// Historial de viajes del conductor autenticado, separado en activos (en curso /
// pendientes) y cerrados (finalizados / cancelados), para que la app los agrupe.
export async function GET(request: Request) {
  const session = await requireConductorSession(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const reservas = await findHistorialForConductor(session);
  const viajes = reservas.map(serializeConductorViajeResumen);

  return NextResponse.json({
    activos: viajes.filter((viaje) => viaje.activo),
    historial: viajes.filter((viaje) => !viaje.activo),
  });
}
