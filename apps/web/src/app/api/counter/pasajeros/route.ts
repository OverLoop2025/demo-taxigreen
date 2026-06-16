import { EstadoAbordaje, EstadoReserva, Rol, prisma } from '@taxigreen/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Lista de pasajeros con pase pendiente de validación en el mostrador.
 * Solo visible para usuarios con rol supervisor (counter) o admin.
 */
export async function GET() {
  const session = await auth();
  const rol = session?.user?.role as Rol | undefined;
  if (!rol || (rol !== Rol.supervisor && rol !== Rol.admin_tenant)) {
    return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
  }

  // Sala de espera: TODO pasajero del flujo aeropuerto que ya reservó y aún no
  // valida su pase. Incluye `necesita_revision` (recién creada, sin conductor aún):
  // antes se excluía y por eso no aparecía al reservar. Se ordena por hora de
  // servicio (los próximos a llegar primero) para que el counter priorice.
  const reservas = await prisma.reservas.findMany({
    where: {
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
      estado: {
        in: [EstadoReserva.necesita_revision, EstadoReserva.confirmada, EstadoReserva.asignada],
      },
      deleted_at: null,
    },
    select: {
      id: true,
      voucher_codigo: true,
      pasajero_nombre: true,
      vuelo_codigo: true,
      punto_encuentro: true,
      origen_texto: true,
      fecha_hora_servicio: true,
      estado: true,
    },
    // Postgres ordena NULLS LAST por defecto en ASC: las reservas sin hora quedan al final.
    orderBy: [{ fecha_hora_servicio: 'asc' }, { created_at: 'asc' }],
    take: 40,
  });

  return NextResponse.json({
    pasajeros: reservas.map((r) => ({
      ...r,
      fecha_hora_servicio: r.fecha_hora_servicio?.toISOString() ?? null,
    })),
  });
}
