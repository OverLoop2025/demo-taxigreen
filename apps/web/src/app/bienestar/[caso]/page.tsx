import { notFound } from 'next/navigation';
import { prisma } from '@taxigreen/database';
import { incidenciaSelect, serializeIncident } from '@/lib/incidencias';
import { BienestarCasoClient } from './seguimiento-caso';

export const dynamic = 'force-dynamic';

export default async function BienestarCasoPage({
  params,
  searchParams,
}: {
  params: Promise<{ caso: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ caso }, query] = await Promise.all([params, searchParams]);
  const incidencia = await prisma.incidencias.findFirst({
    where: {
      id: caso,
      deleted_at: null,
    },
    select: incidenciaSelect,
  });

  if (!incidencia) {
    notFound();
  }

  const token =
    query.t && query.t === incidencia.reserva.token_pasajero ? incidencia.reserva.token_pasajero : null;

  return <BienestarCasoClient initialIncident={serializeIncident(incidencia)} token={token} />;
}
