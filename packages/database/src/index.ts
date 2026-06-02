/**
 * @taxigreen/database — cliente Prisma singleton.
 *
 * En Sprint 0 el schema está vacío (sin modelos). El singleton ya queda listo
 * para que Sprint 1 añada las 10 tablas sin tocar este archivo.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
