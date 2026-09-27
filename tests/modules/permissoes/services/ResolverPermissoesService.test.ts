import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import ResolverPermissoesService from '@modules/permissoes/services/ResolverPermissoesService';

function montar(resolvidas: { todasPermissoes: boolean; permissoes: string[] } | null) {
  const repository = { permissoesDoUsuario: vi.fn(() => Promise.resolve(resolvidas)) };
  const service = new ResolverPermissoesService(repository as unknown as IPerfisRepository);
  return { service, repository };
}

describe('ResolverPermissoesService', () => {
  it('devolve as permissões dos perfis, lidas do banco a cada chamada', async () => {
    const { service, repository } = montar({ todasPermissoes: false, permissoes: ['users:read'] });

    expect(await service.execute('u-1')).toEqual(['users:read']);
    expect(await service.execute('u-1')).toEqual(['users:read']);
    expect(repository.permissoesDoUsuario).toHaveBeenCalledTimes(2);
    expect(repository.permissoesDoUsuario).toHaveBeenCalledWith('u-1');
  });

  it('acesso total vira ["*"]', async () => {
    const { service } = montar({ todasPermissoes: true, permissoes: ['users:read'] });

    expect(await service.execute('u-1')).toEqual(['*']);
  });

  it('usuário inexistente devolve null', async () => {
    const { service } = montar(null);

    expect(await service.execute('u-1')).toBeNull();
  });
});
