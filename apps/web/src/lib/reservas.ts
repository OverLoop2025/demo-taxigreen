import { prisma } from '@taxigreen/database';

export async function findReservaByPublicId(id: string) {
  return prisma.reservas.findFirst({
    where: {
      deleted_at: null,
      OR: [{ id }, { voucher_codigo: id }, { token_pasajero: id }],
    },
    include: {
      conductor: {
        include: {
          usuario: {
            select: {
              nombre: true,
            },
          },
          vehiculo: {
            select: {
              placa: true,
            },
          },
        },
      },
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      pago: true,
    },
  });
}
