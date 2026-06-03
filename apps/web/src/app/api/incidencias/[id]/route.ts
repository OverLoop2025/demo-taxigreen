import { prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { incidenciaSelect, serializeIncident } from '@/lib/incidencias';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidencia = await prisma.incidencias.findFirst({
    where: {
      id,
      deleted_at: null,
    },
    select: incidenciaSelect,
  });

  if (!incidencia) {
    return NextResponse.json({ error: 'incidencia_no_encontrada' }, { status: 404 });
  }

  return NextResponse.json(serializeIncident(incidencia));
}
