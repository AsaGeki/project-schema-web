import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import TraduzirPermissoesService from '@modules/permissoes/services/perfis/TraduzirPermissoesService';
import { InternalServerError, UnprocessableEntityError } from '@shared/errors/UniversalError';

function montar(ids: string[]) {
  const repository = { idsDasPermissoes: vi.fn(() => Promise.resolve(ids)) };
  return { service: new TraduzirPermissoesService(repository as unknown as IPerfisRepository), repository };
}

describe('TraduzirPermissoesService', () => {
  it('traduz para ids, contando repetida uma vez', async () => {
    const { service, repository } = montar(['id-1']);

    await expect(service.execute(['users:read', 'users:read'])).resolves.toEqual(['id-1']);
    expect(repository.idsDasPermissoes).toHaveBeenCalledWith(['users:read']);
  });

  it('permissão fora do catálogo, ou sem ":", é 422 listando só as inexistentes', async () => {
    const { service, repository } = montar([]);

    const erro = await service.execute(['users:read', 'users:voar', 'users']).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(UnprocessableEntityError);
    expect((erro as UnprocessableEntityError).details).toEqual(['users:voar', 'users']);
    expect(repository.idsDasPermissoes).not.toHaveBeenCalled();
  });

  it('permissão do catálogo ausente no banco é 500: o seed não rodou', async () => {
    const { service } = montar(['id-1']);

    await expect(service.execute(['users:read', 'logs:read'])).rejects.toBeInstanceOf(InternalServerError);
  });

  it('lista vazia devolve lista vazia', async () => {
    const { service, repository } = montar([]);

    await expect(service.execute([])).resolves.toEqual([]);
    expect(repository.idsDasPermissoes).toHaveBeenCalledWith([]);
  });
});
