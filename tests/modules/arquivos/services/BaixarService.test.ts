import { describe, expect, it, vi } from 'vitest';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import BaixarService from '@modules/arquivos/services/BaixarService';
import { NotFoundError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';

function montar(arquivo: object | null) {
  const repository = { findById: vi.fn(() => Promise.resolve(arquivo)) };
  const storage = { path: vi.fn((key: string) => `/uploads/${key}`) };
  return new BaixarService(repository as unknown as IArquivosRepository, storage as unknown as IFileStorage);
}

describe('BaixarService', () => {
  it('devolve o caminho no storage e o nome original', async () => {
    const service = montar({ arquivo: 'arquivos/k1.pdf', nomeOriginal: 'relatório.pdf' });

    await expect(service.execute('a-1')).resolves.toEqual({
      caminho: '/uploads/arquivos/k1.pdf',
      nome: 'relatório.pdf',
    });
  });

  it('arquivo inexistente, 404', async () => {
    await expect(montar(null).execute('a-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
