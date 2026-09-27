import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import DeleteService from '@modules/users/services/DeleteService';
import { ConflictError, ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';

function montar(
  opcoes: { alvo?: { todasPermissoes: boolean; permissoes: string[] } | null; outrosAdmins?: number } = {},
) {
  const repository = { delete: vi.fn(() => Promise.resolve({ id: 'alvo', email: 'alvo@exemplo.com' })) };
  const perfisRepository = {
    permissoesDoUsuario: vi.fn(() =>
      Promise.resolve(opcoes.alvo === undefined ? { todasPermissoes: false, permissoes: [] } : opcoes.alvo),
    ),
    contarUsuariosComAcessoTotal: vi.fn(() => Promise.resolve(opcoes.outrosAdmins ?? 0)),
  };
  const service = new DeleteService(
    repository as unknown as IUsersRepository,
    perfisRepository as unknown as IPerfisRepository,
  );
  return { service, repository };
}

describe('DeleteService (users)', () => {
  it('o próprio usuário se remove', async () => {
    const { service, repository } = montar();

    await expect(service.execute('alvo', { id: 'alvo', abilities: [] })).resolves.toEqual({
      success: true,
      status: 204,
    });
    expect(repository.delete).toHaveBeenCalledWith('alvo');
  });

  it('remover outro usuário exige users:delete', async () => {
    const { service, repository } = montar();

    await expect(service.execute('alvo', { id: 'outro', abilities: [] })).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('não remove o último usuário com acesso total', async () => {
    const { service, repository } = montar({ alvo: { todasPermissoes: true, permissoes: [] }, outrosAdmins: 0 });

    await expect(service.execute('alvo', { id: 'outro', abilities: ['*'] })).rejects.toBeInstanceOf(ConflictError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('remove quem tem acesso total quando sobra outro', async () => {
    const { service } = montar({ alvo: { todasPermissoes: true, permissoes: [] }, outrosAdmins: 1 });

    await expect(service.execute('alvo', { id: 'outro', abilities: ['*'] })).resolves.toMatchObject({ status: 204 });
  });

  it('usuário inexistente, 404', async () => {
    const { service } = montar({ alvo: null });

    await expect(service.execute('alvo', { id: 'outro', abilities: ['*'] })).rejects.toBeInstanceOf(NotFoundError);
  });
});
