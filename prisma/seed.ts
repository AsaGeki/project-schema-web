import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Semeadura idempotente: cada registro usa `upsert` sobre a chave natural, para
 * que rodar o seed duas vezes não duplique nem falhe. É o que permite chamá-lo
 * no start de um ambiente efêmero sem checagem prévia.
 */
async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@exemplo.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin@123';

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      password: await bcrypt.hash(password, 10),
      isAdmin: true,
      createdBy: 'seed',
    },
  });

  console.log(`Usuário administrador disponível: ${user.email}`);
}

async function main(): Promise<void> {
  await seedAdmin();
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao semear o banco:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
