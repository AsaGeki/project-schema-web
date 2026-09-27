import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@configs/database/prismaClient';
import { PERMISSOES_DO_CATALOGO } from '@modules/permissoes/catalogoPermissoes';
import { sincronizarCatalogo } from '@modules/permissoes/infra/prisma/sincronizarCatalogo';

async function permissoesNoBanco(): Promise<Set<string>> {
  const permissoes = await prisma.permissao.findMany({ include: { grupo: true } });
  return new Set(permissoes.map(permissao => `${permissao.grupo.slug}:${permissao.acao}`));
}

describe('sincronizarCatalogo (Postgres real)', () => {
  beforeEach(async () => {
    await prisma.perfil.deleteMany();
    await prisma.grupoPermissao.deleteMany();
  });

  afterAll(async () => {
    await prisma.perfil.deleteMany();
    await prisma.grupoPermissao.deleteMany();
    await prisma.$disconnect();
  });

  it('grava exatamente o catálogo do código, e rodar de novo não duplica nada', async () => {
    await sincronizarCatalogo();
    await sincronizarCatalogo();

    expect(await permissoesNoBanco()).toEqual(new Set(PERMISSOES_DO_CATALOGO));
  });

  it('remove ação e grupo que saíram do catálogo, e tira a ação dos perfis', async () => {
    await sincronizarCatalogo();
    const users = await prisma.grupoPermissao.findUniqueOrThrow({ where: { slug: 'users' } });
    const obsoleta = await prisma.permissao.create({ data: { grupoId: users.id, acao: 'obsoleta' } });
    await prisma.grupoPermissao.create({
      data: { slug: 'obsoleto', nome: 'Obsoleto', permissoes: { create: [{ acao: 'x' }] } },
    });
    const perfil = await prisma.perfil.create({
      data: { nome: 'Antigo', permissoes: { create: [{ permissaoId: obsoleta.id }] } },
      include: { permissoes: true },
    });
    expect(perfil.permissoes).toHaveLength(1);

    await sincronizarCatalogo();

    expect(await permissoesNoBanco()).toEqual(new Set(PERMISSOES_DO_CATALOGO));
    expect(await prisma.perfilPermissao.count({ where: { perfilId: perfil.id } })).toBe(0);
  });
});
