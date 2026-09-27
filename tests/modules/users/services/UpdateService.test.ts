import { describe, expect, it, vi } from 'vitest';

import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import UpdateService from '@modules/users/services/UpdateService';
import { ConflictError, ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import type HashService from '@shared/services/HashService';

const atualizado = { id: 'alvo', name: 'Novo', email: 'alvo@exemplo.com' };

function montar(opcoes: { dono?: { id: string } | null; resultado?: unknown } = {}) {
  const repository = {
    findByEmail: vi.fn(() => Promise.resolve(opcoes.dono ?? null)),
    update: vi.fn(() => Promise.resolve(opcoes.resultado === undefined ? atualizado : opcoes.resultado)),
  };
  const hashService = { hash: vi.fn((senha: string) => Promise.resolve(`hash(${senha})`)) };
  const service = new UpdateService(repository as unknown as IUsersRepository, hashService as unknown as HashService);
  return { service, repository };
}

describe('UpdateService (users)', () => {
  it('o próprio usuário edita o cadastro sem permissão nenhuma', async () => {
    const { service, repository } = montar();

    await service.execute('alvo', { name: 'Novo' }, { id: 'alvo', abilities: [] });

    expect(repository.update).toHaveBeenCalledWith('alvo', { name: 'Novo', updatedBy: 'alvo' });
  });

  it('editar outro usuário exige users:update', async () => {
    const { service } = montar();

    await expect(service.execute('alvo', { name: 'Novo' }, { id: 'outro', abilities: [] })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      service.execute('alvo', { name: 'Novo' }, { id: 'outro', abilities: ['users:update'] }),
    ).resolves.toMatchObject({ status: 200 });
  });

  it('grava a senha nova com hash', async () => {
    const { service, repository } = montar();

    await service.execute('alvo', { password: '12345678' }, { id: 'alvo', abilities: [] });

    expect(repository.update).toHaveBeenCalledWith('alvo', { password: 'hash(12345678)', updatedBy: 'alvo' });
  });

  it('e-mail de outro usuário, 409', async () => {
    const { service } = montar({ dono: { id: 'terceiro' } });

    await expect(
      service.execute('alvo', { email: 'x@exemplo.com' }, { id: 'alvo', abilities: [] }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('usuário inexistente, 404', async () => {
    const { service } = montar({ resultado: null });

    await expect(service.execute('alvo', { name: 'x' }, { id: 'alvo', abilities: [] })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
