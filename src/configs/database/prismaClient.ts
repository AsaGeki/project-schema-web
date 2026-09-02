import { PrismaClient } from '@prisma/client';

/**
 * Instância única do Prisma. `tsx watch` recarrega o módulo a cada alteração, e
 * sem o cache no `globalThis` cada recarga abriria um pool novo de conexões.
 */
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
