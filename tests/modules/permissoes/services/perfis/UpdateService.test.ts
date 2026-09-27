import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import type TraduzirPermissoesService from '@modules/permissoes/services/perfis/TraduzirPermissoesService';
import UpdateService from '@modules/permissoes/services/perfis/UpdateService';
import { ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';

const perfil = { id: 'p-1', nome: 'Leitor', todasPermissoes: false, permissoes: ['users:read'] };

function montar(atual: unknown = perfil) {
  const repository = {
    findById: vi.fn(() => Promise.resolve(atual)),
    update: vi.fn(() => Promise.resolve(perfil)),
  };
  const traduzir = { execute: vi.fn(() => Promise.resolve(['id-logs'])) };
  const service = new UpdateService(
    repository as unknown as IPerfisRepository,
    traduzir as unknown as TraduzirPermissoesService,
  );
  return { service, repository, traduzir };
}

describe('UpdateService (perfis)', () => {
  it('troca as permissões', async () => {
    const { service, repository } = montar();

    await service.execute('p-1', { permissoes: ['logs:read'] }, 'autor');

    expect(repository.update).toHaveBeenCalledWith('p-1', {
      nome: undefined,
      descricao: undefined,
      updatedBy: 'autor',
      permissaoIds: ['id-logs'],
    });
  });

  it('sem permissões no corpo, mantém as atuais', async () => {
    const { service, repository, traduzir } = montar();

    await service.execute('p-1', { nome: 'Novo' }, 'autor');

    expect(traduzir.execute).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith('p-1', { nome: 'Novo', descricao: undefined, updatedBy: 'autor' });
  });

  it('o perfil de acesso total não muda pela API', async () => {
    const { service, repository } = montar({ ...perfil, todasPermissoes: true });

    await expect(service.execute('p-1', { nome: 'x' }, 'autor')).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('perfil inexistente, 404', async () => {
    const { service } = montar(null);

    await expect(service.execute('p-1', { nome: 'x' }, 'autor')).rejects.toBeInstanceOf(NotFoundError);
  });
});
