import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@configs/database/prismaClient';
import PerfisRepository from '@modules/permissoes/infra/prisma/repositories/PerfisRepository';

const repository = new PerfisRepository();

async function limparBanco(): Promise<void> {
  await prisma.perfil.deleteMany();
  await prisma.user.deleteMany();
  await prisma.grupoPermissao.deleteMany();
}

async function criarPermissoes(): Promise<void> {
  await prisma.grupoPermissao.create({
    data: { slug: 'users', nome: 'Usuários', permissoes: { create: [{ acao: 'read' }, { acao: 'update' }] } },
  });
  await prisma.grupoPermissao.create({
    data: { slug: 'logs', nome: 'Logs', permissoes: { create: [{ acao: 'read' }] } },
  });
}

async function criarUsuario(email: string) {
  return prisma.user.create({ data: { name: 'Teste', email, password: 'hash' } });
}

describe('PerfisRepository (Postgres real)', () => {
  beforeEach(async () => {
    await limparBanco();
    await criarPermissoes();
  });

  afterAll(async () => {
    await limparBanco();
    await prisma.$disconnect();
  });

  it('traduz grupo:acao em ids, deixando de fora o que não existe', async () => {
    const ids = await repository.idsDasPermissoes(['users:read', 'logs:read', 'users:inexistente']);

    expect(ids).toHaveLength(2);
    expect(await repository.idsDasPermissoes([])).toEqual([]);
  });

  it('cria, lê, atualiza e remove perfil com as permissões em grupo:acao', async () => {
    const criado = await repository.create({
      nome: 'Leitor',
      permissaoIds: await repository.idsDasPermissoes(['users:read', 'logs:read']),
      createdBy: 'teste',
    });

    expect(criado).toMatchObject({
      nome: 'Leitor',
      descricao: null,
      todasPermissoes: false,
      permissoes: ['logs:read', 'users:read'],
    });
    expect(await repository.findById(criado.id)).toEqual(criado);

    const atualizado = await repository.update(criado.id, {
      descricao: 'Só usuários',
      permissaoIds: await repository.idsDasPermissoes(['users:update']),
    });
    expect(atualizado).toMatchObject({ descricao: 'Só usuários', permissoes: ['users:update'] });

    expect(await repository.delete(criado.id)).toMatchObject({ id: criado.id });
    expect(await repository.findById(criado.id)).toBeNull();
  });

  it('update e delete de perfil inexistente devolvem null', async () => {
    const inexistente = '00000000-0000-0000-0000-000000000000';

    expect(await repository.update(inexistente, { nome: 'x' })).toBeNull();
    expect(await repository.delete(inexistente)).toBeNull();
  });

  it('lista paginada por nome, com a busca do filterConfig', async () => {
    for (const nome of ['Auditor', 'Leitor', 'Operador']) await repository.create({ nome, permissaoIds: [] });

    const { items, ...paginacao } = await repository.list({ page: 1, limit: 2, search: 'or' });

    expect(items.map(perfil => perfil.nome)).toEqual(['Auditor', 'Leitor']);
    expect(paginacao).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2, hasNext: true });
  });

  it('soma as permissões de todos os perfis do usuário, sem repetir', async () => {
    const usuario = await criarUsuario('u@exemplo.com');
    const leitor = await repository.create({
      nome: 'Leitor',
      permissaoIds: await repository.idsDasPermissoes(['users:read']),
    });
    const logs = await repository.create({
      nome: 'Logs',
      permissaoIds: await repository.idsDasPermissoes(['users:read', 'logs:read']),
    });

    expect(await repository.definirPerfisDoUsuario(usuario.id, [leitor.id, logs.id])).toBe(true);
    expect(await repository.permissoesDoUsuario(usuario.id)).toEqual({
      todasPermissoes: false,
      permissoes: ['logs:read', 'users:read'],
    });
  });

  it('usuário sem perfil tem lista vazia, e usuário inexistente devolve null', async () => {
    const usuario = await criarUsuario('sem@exemplo.com');

    expect(await repository.permissoesDoUsuario(usuario.id)).toEqual({ todasPermissoes: false, permissoes: [] });
    expect(await repository.permissoesDoUsuario('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await repository.definirPerfisDoUsuario('00000000-0000-0000-0000-000000000000', [])).toBe(false);
  });

  it('conta quem tem acesso total, fora o usuário informado', async () => {
    const admin = await prisma.perfil.create({ data: { nome: 'Administrador', todasPermissoes: true } });
    const comum = await repository.create({ nome: 'Comum', permissaoIds: [] });
    const a = await criarUsuario('a@exemplo.com');
    const b = await criarUsuario('b@exemplo.com');
    await repository.definirPerfisDoUsuario(a.id, [admin.id]);
    await repository.definirPerfisDoUsuario(b.id, [comum.id]);

    expect(await repository.permissoesDoUsuario(a.id)).toMatchObject({ todasPermissoes: true });
    expect(await repository.contarUsuariosComAcessoTotal(b.id)).toBe(1);
    expect(await repository.contarUsuariosComAcessoTotal(a.id)).toBe(0);
    expect(await repository.algumComAcessoTotal([comum.id, admin.id])).toBe(true);
    expect(await repository.algumComAcessoTotal([comum.id])).toBe(false);
    expect(await repository.contarExistentes([admin.id, comum.id, '00000000-0000-0000-0000-000000000000'])).toBe(2);
  });
});
