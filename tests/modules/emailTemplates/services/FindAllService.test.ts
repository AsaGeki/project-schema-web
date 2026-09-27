import { describe, expect, it, vi } from 'vitest';

import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import FindAllService from '@modules/emailTemplates/services/FindAllService';

describe('FindAllService (emailTemplates)', () => {
  it('lista toda flag do catálogo, com os tokens, publicada ou não', async () => {
    const repository = { findByFlag: vi.fn(() => Promise.resolve(null)) };
    const service = new FindAllService(repository as unknown as IEmailTemplatesRepository);

    const resposta = await service.execute();

    expect(resposta.data).toEqual([
      expect.objectContaining({ flag: 'usuario_criado', titulo: 'Usuário criado', publicado: false, isActive: false }),
    ]);
    expect(resposta.data?.[0]?.tokens.map(token => token.nome)).toEqual(['usuario.nome', 'usuario.email']);
  });
});
