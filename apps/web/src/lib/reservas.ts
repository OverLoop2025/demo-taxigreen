import { prisma } from '@taxigreen/database';

export async function findReservaByPublicId(id: string) {
  return prisma.reservas.findFirst({
    where: {
      deleted_at: null,
      OR: [{ id }, { voucher_codigo: id }, { token_pasajero: id }],
    },
    include: {
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });
}
