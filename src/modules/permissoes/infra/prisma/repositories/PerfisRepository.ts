import { prisma } from '@configs/database/prismaClient';
import type {
  IPerfilCreate,
  IPerfilPublico,
  IPerfilUpdate,
  IPermissoesResolvidas,
} from '@modules/permissoes/dtos/PerfilDTO';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import type { IFilterConfig } from '@shared/types/filter';
import type { IListQuery, IPaginated } from '@shared/types/pagination';
import { buildPaginationMeta } from '@shared/utils/pagination/buildPaginationMeta';
import { buildPrismaWhere } from '@shared/utils/query/buildPrismaWhere';

import type { Prisma } from '@prisma/client';

/** Permissões do perfil com o slug do grupo, que é o que forma `grupo:acao`. */
const comPermissoes = {
  permissoes: { select: { permissao: { select: { acao: true, grupo: { select: { slug: true } } } } } },
} satisfies Prisma.PerfilInclude;

const filterConfig: IFilterConfig = {
  equals: [{ field: 'todasPermissoes', as: 'boolean' }],
  search: { text: ['nome', 'descricao'] },
};

/** Código do Prisma para registro não encontrado em update/delete. */
const RECORD_NOT_FOUND = 'P2025';

function chaveDe(permissao: { acao: string; grupo: { slug: string } }): string {
  return `${permissao.grupo.slug}:${permissao.acao}`;
}

function paraPublico(perfil: Prisma.PerfilGetPayload<{ include: typeof comPermissoes }>): IPerfilPublico {
  const { permissoes, ...campos } = perfil;

  return { ...campos, permissoes: permissoes.map(({ permissao }) => chaveDe(permissao)).sort() };
}

async function nuloSeInexistente<T>(operacao: () => Promise<T>): Promise<T | null> {
  try {
    return await operacao();
  } catch (error) {
    if ((error as { code?: string }).code === RECORD_NOT_FOUND) return null;
    throw error;
  }
}

export default class PerfisRepository implements IPerfisRepository {
  public async create(data: IPerfilCreate): Promise<IPerfilPublico> {
    const perfil = await prisma.perfil.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        createdBy: data.createdBy ?? null,
        permissoes: { create: data.permissaoIds.map(permissaoId => ({ permissaoId })) },
      },
      include: comPermissoes,
    });

    return paraPublico(perfil);
  }

  public async findById(id: string): Promise<IPerfilPublico | null> {
    const perfil = await prisma.perfil.findUnique({ where: { id }, include: comPermissoes });

    return perfil ? paraPublico(perfil) : null;
  }

  public async update(id: string, data: IPerfilUpdate): Promise<IPerfilPublico | null> {
    const perfil = await nuloSeInexistente(() =>
      prisma.perfil.update({
        where: { id },
        data: {
          ...(data.nome !== undefined && { nome: data.nome }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
          ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
          ...(data.permissaoIds && {
            permissoes: { deleteMany: {}, create: data.permissaoIds.map(permissaoId => ({ permissaoId })) },
          }),
        },
        include: comPermissoes,
      }),
    );

    return perfil ? paraPublico(perfil) : null;
  }

  public async delete(id: string): Promise<IPerfilPublico | null> {
    const perfil = await nuloSeInexistente(() => prisma.perfil.delete({ where: { id }, include: comPermissoes }));

    return perfil ? paraPublico(perfil) : null;
  }

  public async list(query: IListQuery): Promise<IPaginated<IPerfilPublico>> {
    const where = buildPrismaWhere<Prisma.PerfilWhereInput>(query, filterConfig);

    const [perfis, total] = await Promise.all([
      prisma.perfil.findMany({
        where,
        include: comPermissoes,
        orderBy: { nome: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.perfil.count({ where }),
    ]);

    return { items: perfis.map(paraPublico), ...buildPaginationMeta(query.page, query.limit, total) };
  }

  public async idsDasPermissoes(chaves: string[]): Promise<string[]> {
    if (chaves.length === 0) return [];

    const permissoes = await prisma.permissao.findMany({
      where: {
        OR: chaves.map(chave => {
          const separador = chave.indexOf(':');
          return { acao: chave.slice(separador + 1), grupo: { slug: chave.slice(0, separador) } };
        }),
      },
      select: { id: true },
    });

    return permissoes.map(({ id }) => id);
  }

  public async contarExistentes(perfilIds: string[]): Promise<number> {
    return prisma.perfil.count({ where: { id: { in: perfilIds } } });
  }

  public async algumComAcessoTotal(perfilIds: string[]): Promise<boolean> {
    return (await prisma.perfil.count({ where: { id: { in: perfilIds }, todasPermissoes: true } })) > 0;
  }

  public async permissoesDoUsuario(userId: string): Promise<IPermissoesResolvidas | null> {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { perfis: { select: { todasPermissoes: true, ...comPermissoes } } },
    });

    if (!usuario) return null;

    const permissoes = usuario.perfis.flatMap(perfil => perfil.permissoes.map(({ permissao }) => chaveDe(permissao)));

    return {
      todasPermissoes: usuario.perfis.some(perfil => perfil.todasPermissoes),
      permissoes: [...new Set(permissoes)].sort(),
    };
  }

  public async definirPerfisDoUsuario(userId: string, perfilIds: string[]): Promise<boolean> {
    const usuario = await nuloSeInexistente(() =>
      prisma.user.update({
        where: { id: userId },
        data: { perfis: { set: perfilIds.map(id => ({ id })) } },
        select: { id: true },
      }),
    );

    return usuario !== null;
  }

  public async contarUsuariosComAcessoTotal(excetoUserId: string): Promise<number> {
    return prisma.user.count({ where: { id: { not: excetoUserId }, perfis: { some: { todasPermissoes: true } } } });
  }
}
