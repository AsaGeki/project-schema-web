import { describe, expect, it, vi } from 'vitest';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import AtribuirPerfisService from '@modules/users/services/AtribuirPerfisService';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/UniversalError';

interface IOpcoes {
  existentes?: number;
  atual?: { todasPermissoes: boolean; permissoes: string[] } | null;
  novoTemAcessoTotal?: boolean;
  outrosAdmins?: number;
}

function montar(opcoes: IOpcoes = {}) {
  const repository = {
    contarExistentes: vi.fn((ids: string[]) => Promise.resolve(opcoes.existentes ?? ids.length)),
    permissoesDoUsuario: vi.fn(() =>
      Promise.resolve(opcoes.atual === undefined ? { todasPermissoes: false, permissoes: [] } : opcoes.atual),
    ),
    algumComAcessoTotal: vi.fn(() => Promise.resolve(opcoes.novoTemAcessoTotal ?? false)),
    contarUsuariosComAcessoTotal: vi.fn(() => Promise.resolve(opcoes.outrosAdmins ?? 0)),
    definirPerfisDoUsuario: vi.fn(() => Promise.resolve(true)),
  };
  const service = new AtribuirPerfisService(repository as unknown as IPerfisRepository);
  return { service, repository };
}

describe('AtribuirPerfisService', () => {
  it('substitui os perfis, sem repetir', async () => {
    const { service, repository } = montar();

    await expect(service.execute('u-1', ['p-1', 'p-1', 'p-2'])).resolves.toEqual({ success: true, status: 204 });
    expect(repository.definirPerfisDoUsuario).toHaveBeenCalledWith('u-1', ['p-1', 'p-2']);
  });

  it('lista vazia tira todos os perfis', async () => {
    const { service, repository } = montar();

    await service.execute('u-1', []);

    expect(repository.definirPerfisDoUsuario).toHaveBeenCalledWith('u-1', []);
  });

  it('perfil inexistente, 422', async () => {
    const { service, repository } = montar({ existentes: 1 });

    await expect(service.execute('u-1', ['p-1', 'nao-existe'])).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(repository.definirPerfisDoUsuario).not.toHaveBeenCalled();
  });

  it('usuário inexistente, 404', async () => {
    const { service } = montar({ atual: null });

    await expect(service.execute('u-1', [])).rejects.toBeInstanceOf(NotFoundError);
  });

  it('não tira o acesso total do último usuário que o tem', async () => {
    const { service, repository } = montar({ atual: { todasPermissoes: true, permissoes: [] }, outrosAdmins: 0 });

    await expect(service.execute('u-1', ['p-comum'])).rejects.toBeInstanceOf(ConflictError);
    expect(repository.definirPerfisDoUsuario).not.toHaveBeenCalled();
  });

  it('tira o acesso total quando sobra outro usuário com ele', async () => {
    const { service } = montar({ atual: { todasPermissoes: true, permissoes: [] }, outrosAdmins: 1 });

    await expect(service.execute('u-1', ['p-comum'])).resolves.toMatchObject({ status: 204 });
  });

  it('manter o acesso total não depende de outros administradores', async () => {
    const { service } = montar({ atual: { todasPermissoes: true, permissoes: [] }, novoTemAcessoTotal: true });

    await expect(service.execute('u-1', ['p-admin'])).resolves.toMatchObject({ status: 204 });
  });
});
