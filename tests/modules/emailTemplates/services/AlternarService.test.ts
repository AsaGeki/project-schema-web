import { describe, expect, it, vi } from 'vitest';

import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import AlternarService from '@modules/emailTemplates/services/AlternarService';
import { NotFoundError } from '@shared/errors/UniversalError';

function montar(template: object | null) {
  const repository = {
    findByFlag: vi.fn(() => Promise.resolve(template)),
    update: vi.fn(() => Promise.resolve({ ...template, isActive: false })),
  };
  return { service: new AlternarService(repository as unknown as IEmailTemplatesRepository), repository };
}

describe('AlternarService', () => {
  it('liga ou desliga o template publicado, com o autor', async () => {
    const { service, repository } = montar({ id: 't-1', flag: 'usuario_criado' });

    await expect(service.execute('usuario_criado', false, 'u-1')).resolves.toMatchObject({ status: 200 });
    expect(repository.update).toHaveBeenCalledWith('t-1', { isActive: false, updatedBy: 'u-1' });
  });

  it('template ainda não publicado, 404', async () => {
    await expect(montar(null).service.execute('usuario_criado', true, 'u-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
