import { describe, expect, it, vi } from 'vitest';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import PublishService from '@modules/emailTemplates/services/PublishService';
import { NotFoundError } from '@shared/errors/UniversalError';

const ID_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const ID_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const conteudo = {
  titulo: 'Boas-vindas',
  structure: {},
  htmlRenderizado: '<p>Oi</p>',
  assunto: 'Oi',
  anexos: [] as string[],
  imagensInline: [] as string[],
  destinatariosFixos: [],
};

function montar(arquivos: Record<string, { tamanhoBytes: number; mimeType: string }>) {
  const repository = { upsertByFlag: vi.fn(() => Promise.resolve({ flag: 'usuario_criado' })) };
  const arquivosRepository = { findById: vi.fn((id: string) => Promise.resolve(arquivos[id] ?? null)) };
  const service = new PublishService(
    repository as unknown as IEmailTemplatesRepository,
    arquivosRepository as unknown as IArquivosRepository,
  );
  return { service, repository };
}

describe('PublishService', () => {
  it('publica pela flag com o autor', async () => {
    const { service, repository } = montar({});

    await expect(service.execute('usuario_criado', conteudo, 'u-1')).resolves.toMatchObject({ status: 200 });
    expect(repository.upsertByFlag).toHaveBeenCalledWith('usuario_criado', conteudo, 'u-1');
  });

  it('flag que não existe, 404', async () => {
    await expect(montar({}).service.execute('nao_existe', conteudo, 'u-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('anexo que não existe, 422 ANEXO_INEXISTENTE', async () => {
    const { service, repository } = montar({});

    await expect(service.execute('usuario_criado', { ...conteudo, anexos: [ID_A] }, 'u-1')).rejects.toMatchObject({
      status: 422,
      code: 'ANEXO_INEXISTENTE',
    });
    expect(repository.upsertByFlag).not.toHaveBeenCalled();
  });

  it('anexos acima de 10 MB somados, 422 ANEXOS_ACIMA_DO_LIMITE', async () => {
    const seisMb = { tamanhoBytes: 6 * 1024 * 1024, mimeType: 'application/pdf' };
    const { service } = montar({ [ID_A]: seisMb, [ID_B]: seisMb });

    await expect(service.execute('usuario_criado', { ...conteudo, anexos: [ID_A, ID_B] }, 'u-1')).rejects.toMatchObject(
      {
        code: 'ANEXOS_ACIMA_DO_LIMITE',
      },
    );
  });

  it('imagem inline que não é imagem, 422 IMAGEM_INLINE_INVALIDA', async () => {
    const { service } = montar({ [ID_A]: { tamanhoBytes: 10, mimeType: 'application/pdf' } });

    await expect(
      service.execute('usuario_criado', { ...conteudo, imagensInline: [ID_A] }, 'u-1'),
    ).rejects.toMatchObject({
      code: 'IMAGEM_INLINE_INVALIDA',
    });
  });
});
