import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@configs/database/prismaClient';
import UsersRepository from '@modules/users/infra/prisma/repositories/UsersRepository';

const repository = new UsersRepository();

const novoUsuario = (email: string) => ({ name: 'Teste', email, password: 'hash-da-senha', createdBy: null });

describe('UsersRepository (Postgres real)', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('nenhum método herdado da base devolve o hash da senha', async () => {
    const criado = await repository.create(novoUsuario('a@exemplo.com'));
    const encontrado = await repository.findById(criado.id);
    const atualizado = await repository.update(criado.id, { name: 'Outro nome' });
    const pagina = await repository.list({ page: 1, limit: 10 });
    const removido = await repository.delete(criado.id);

    for (const registro of [criado, encontrado, atualizado, removido, ...pagina.items]) {
      expect(registro).not.toHaveProperty('password');
    }
  });

  it('findByEmail também não devolve a senha', async () => {
    await repository.create(novoUsuario('b@exemplo.com'));

    expect(await repository.findByEmail('b@exemplo.com')).not.toHaveProperty('password');
  });

  it('findByEmailWithPassword é o único que traz o hash', async () => {
    await repository.create(novoUsuario('c@exemplo.com'));

    expect(await repository.findByEmailWithPassword('c@exemplo.com')).toMatchObject({ password: 'hash-da-senha' });
  });

  it('pagina com os campos na raiz', async () => {
    for (const indice of [1, 2, 3]) await repository.create(novoUsuario(`p${indice}@exemplo.com`));

    const { items, ...paginacao } = await repository.list({ page: 2, limit: 2 });

    expect(items).toHaveLength(1);
    expect(paginacao).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2, hasNext: false });
  });

  it('update e delete de id inexistente devolvem null em vez de lançar', async () => {
    const inexistente = '00000000-0000-0000-0000-000000000000';

    expect(await repository.update(inexistente, { name: 'x' })).toBeNull();
    expect(await repository.delete(inexistente)).toBeNull();
  });
});
