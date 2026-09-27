import { describe, expect, it, vi } from 'vitest';

import UsuarioCriadoResolver from '@modules/emailTemplates/resolvers/UsuarioCriadoResolver';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { NotFoundError } from '@shared/errors/UniversalError';

function montar(usuario: object | null) {
  const repository = { findById: vi.fn(() => Promise.resolve(usuario)) };
  return new UsuarioCriadoResolver(repository as unknown as IUsersRepository);
}

describe('UsuarioCriadoResolver', () => {
  it('entrega nome e e-mail do usuário e sugere ele como destinatário', async () => {
    const resolver = montar({ id: 'u-9', name: 'Arthur', email: 'arthur@exemplo.com' });

    await expect(resolver.execute({ ids: ['u-9'], autorId: 'u-1' })).resolves.toEqual({
      destinatarios: ['arthur@exemplo.com'],
      dados: { usuario: { nome: 'Arthur', email: 'arthur@exemplo.com' } },
    });
  });

  it('sem id ou usuário inexistente, 404', async () => {
    await expect(montar(null).execute({ ids: ['u-9'], autorId: 'u-1' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(montar(null).execute({ ids: [], autorId: 'u-1' })).rejects.toBeInstanceOf(NotFoundError);
  });
});
