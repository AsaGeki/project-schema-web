import { PrismaClient } from '@prisma/client';

/**
 * A senha do usuário nunca sai de uma query por padrão: a base de repositório
 * devolve o registro inteiro, e sem o `omit` global o hash iria parar em toda
 * resposta HTTP. Quem precisa dela pede explicitamente com `omit: { password: false }`.
 */
function createPrismaClient() {
  return new PrismaClient({ omit: { user: { password: true } } });
}

/**
 * Instância única do Prisma. `tsx watch` recarrega o módulo a cada alteração, e
 * sem o cache no `globalThis` cada recarga abriria um pool novo de conexões.
 */
const globalForPrisma = globalThis as typeof globalThis & { prisma?: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
