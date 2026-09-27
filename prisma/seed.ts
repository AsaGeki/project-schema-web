import bcrypt from 'bcrypt';

import { prisma } from '../src/configs/database/prismaClient';
import { sincronizarCatalogo } from '../src/modules/permissoes/infra/prisma/sincronizarCatalogo';

const PERFIL_ADMINISTRADOR = 'Administrador';

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
      createdBy: 'seed',
    },
  });

  await prisma.perfil.upsert({
    where: { nome: PERFIL_ADMINISTRADOR },
    update: { todasPermissoes: true, usuarios: { connect: { id: user.id } } },
    create: {
      nome: PERFIL_ADMINISTRADOR,
      descricao: 'Todas as permissões, atuais e futuras.',
      todasPermissoes: true,
      createdBy: 'seed',
      usuarios: { connect: { id: user.id } },
    },
  });

  console.log(`Usuário administrador disponível: ${user.email}`);
}

async function main(): Promise<void> {
  await sincronizarCatalogo();
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
