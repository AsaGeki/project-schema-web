import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import DeleteService from '@modules/permissoes/services/perfis/DeleteService';
import { ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';

function montar(atual: unknown) {
  const repository = {
    findById: vi.fn(() => Promise.resolve(atual)),
    delete: vi.fn(() => Promise.resolve(atual)),
  };
  const service = new DeleteService(repository as unknown as IPerfisRepository);
  return { service, repository };
}

describe('DeleteService (perfis)', () => {
  it('remove o perfil', async () => {
    const { service, repository } = montar({ id: 'p-1', todasPermissoes: false });

    await expect(service.execute('p-1')).resolves.toEqual({ success: true, status: 204 });
    expect(repository.delete).toHaveBeenCalledWith('p-1');
  });

  it('o perfil de acesso total não sai pela API', async () => {
    const { service, repository } = montar({ id: 'p-1', todasPermissoes: true });

    await expect(service.execute('p-1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('perfil inexistente, 404', async () => {
    const { service } = montar(null);

    await expect(service.execute('p-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
