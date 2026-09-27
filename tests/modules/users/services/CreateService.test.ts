import { describe, expect, it, vi } from 'vitest';

import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import CreateService from '@modules/users/services/CreateService';
import { ConflictError } from '@shared/errors/UniversalError';
import type HashService from '@shared/services/HashService';

const entrada = { name: 'Arthur', email: 'arthur@exemplo.com', password: '12345678' };

const criado = {
  id: 'u-1',
  name: 'Arthur',
  email: 'arthur@exemplo.com',
  isAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
};

function montarService(existente: unknown = null) {
  const repository = {
    findByEmail: vi.fn(() => Promise.resolve(existente)),
    create: vi.fn(() => Promise.resolve(criado)),
  };
  const hashService = { hash: vi.fn((senha: string) => Promise.resolve(`hash(${senha})`)) };

  const service = new CreateService(repository as unknown as IUsersRepository, hashService as unknown as HashService);

  return { service, repository, hashService };
}

describe('CreateService (users)', () => {
  it('grava a senha com hash e responde 201', async () => {
    const { service, repository } = montarService();

    const resultado = await service.execute(entrada, 'autor-1');

    expect(repository.create).toHaveBeenCalledWith({ ...entrada, password: 'hash(12345678)', createdBy: 'autor-1' });
    expect(resultado).toEqual({ success: true, status: 201, message: 'Usuário criado com sucesso!', data: criado });
  });

  it('cadastro sem autor grava createdBy nulo', async () => {
    const { service, repository } = montarService();

    await service.execute(entrada);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: null }));
  });

  it('recusa e-mail já cadastrado com 409, sem gravar', async () => {
    const { service, repository, hashService } = montarService(criado);

    await expect(service.execute(entrada)).rejects.toBeInstanceOf(ConflictError);
    expect(hashService.hash).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
