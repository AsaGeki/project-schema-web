import { describe, expect, it, vi } from 'vitest';

import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import FindByFlagService from '@modules/emailTemplates/services/FindByFlagService';
import { NotFoundError } from '@shared/errors/UniversalError';

function montar(template: object | null) {
  const repository = { findByFlag: vi.fn(() => Promise.resolve(template)) };
  return { service: new FindByFlagService(repository as unknown as IEmailTemplatesRepository), repository };
}

describe('FindByFlagService', () => {
  it('devolve o template publicado', async () => {
    const { service } = montar({ flag: 'usuario_criado', assunto: 'Oi' });

    await expect(service.execute('usuario_criado')).resolves.toMatchObject({ status: 200, data: { assunto: 'Oi' } });
  });

  it('flag inexistente ou sem template, o mesmo 404', async () => {
    const semTemplate = montar(null);
    const inexistente = montar({});

    await expect(semTemplate.service.execute('usuario_criado')).rejects.toBeInstanceOf(NotFoundError);
    await expect(inexistente.service.execute('nao_existe')).rejects.toBeInstanceOf(NotFoundError);
    expect(inexistente.repository.findByFlag).not.toHaveBeenCalled();
  });
});
