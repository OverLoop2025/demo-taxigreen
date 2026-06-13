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

  const reservas = await prisma.reservas.findMany({
    where: {
      estado_abordaje: EstadoAbordaje.pendiente_validacion,
      estado: { in: [EstadoReserva.confirmada, EstadoReserva.asignada] },
      deleted_at: null,
    },
    select: {
      id: true,
      voucher_codigo: true,
      pasajero_nombre: true,
      vuelo_codigo: true,
      punto_encuentro: true,
      origen_texto: true,
    },
    orderBy: { created_at: 'asc' },
    take: 20,
  });

  return NextResponse.json({ pasajeros: reservas });
}
