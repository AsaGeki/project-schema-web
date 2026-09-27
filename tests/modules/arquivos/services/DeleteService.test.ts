import { describe, expect, it, vi } from 'vitest';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import DeleteService from '@modules/arquivos/services/DeleteService';
import { NotFoundError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';

function montar(removido: object | null) {
  const repository = { delete: vi.fn(() => Promise.resolve(removido)) };
  const storage = { remove: vi.fn(() => Promise.resolve()) };
  const service = new DeleteService(repository as unknown as IArquivosRepository, storage as unknown as IFileStorage);
  return { service, storage };
}

describe('DeleteService (arquivos)', () => {
  it('remove o registro e depois o arquivo', async () => {
    const { service, storage } = montar({ arquivo: 'arquivos/k1.pdf', nomeOriginal: 'a.pdf' });

    await expect(service.execute('a-1', 'u-1')).resolves.toEqual({ success: true, status: 204 });
    expect(storage.remove).toHaveBeenCalledWith('arquivos/k1.pdf');
  });

  it('arquivo inexistente, 404 sem tocar no storage', async () => {
    const { service, storage } = montar(null);

    await expect(service.execute('a-1', 'u-1')).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
