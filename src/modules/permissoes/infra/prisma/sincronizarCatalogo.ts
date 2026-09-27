import { prisma } from '@configs/database/prismaClient';
import { CATALOGO_PERMISSOES } from '@modules/permissoes/catalogoPermissoes';

/**
 * Deixa grupos e ações do banco iguais ao catálogo do código: cria o que falta e
 * remove o que saiu dele. A ação removida sai dos perfis junto, pelo cascade.
 */
export async function sincronizarCatalogo(): Promise<void> {
  for (const grupo of CATALOGO_PERMISSOES) {
    const registro = await prisma.grupoPermissao.upsert({
      where: { slug: grupo.slug },
      update: { nome: grupo.nome },
      create: { slug: grupo.slug, nome: grupo.nome },
    });

    for (const acao of grupo.acoes) {
      await prisma.permissao.upsert({
        where: { grupoId_acao: { grupoId: registro.id, acao } },
        update: {},
        create: { grupoId: registro.id, acao },
      });
    }

    await prisma.permissao.deleteMany({ where: { grupoId: registro.id, acao: { notIn: grupo.acoes } } });
  }

  await prisma.grupoPermissao.deleteMany({ where: { slug: { notIn: CATALOGO_PERMISSOES.map(grupo => grupo.slug) } } });
}
