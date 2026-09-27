import { describe, expect, it, vi } from 'vitest';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import type UsuarioCriadoResolver from '@modules/emailTemplates/resolvers/UsuarioCriadoResolver';
import SendService from '@modules/emailTemplates/services/SendService';
import { NotFoundError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';

const ANEXO = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const LOGO = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const templateBase = {
  flag: 'usuario_criado',
  isActive: true,
  assunto: 'Bem-vindo, {{usuario.nome}}',
  htmlRenderizado: '<p>Olá, {{usuario.nome}}</p><img src="cid:' + LOGO + '">',
  anexos: [ANEXO],
  imagensInline: [LOGO],
  destinatariosFixos: ['equipe@exemplo.com'],
};

interface IOpcoes {
  template?: object | null;
  dados?: Record<string, unknown>;
  sugeridos?: string[];
  arquivos?: Record<string, object>;
}

function montar(opcoes: IOpcoes = {}) {
  const posEnvio = vi.fn(() => Promise.resolve());
  const repository = {
    findByFlag: vi.fn(() => Promise.resolve(opcoes.template === undefined ? templateBase : opcoes.template)),
  };
  const resolver = {
    execute: vi.fn(() =>
      Promise.resolve({
        destinatarios: opcoes.sugeridos ?? ['arthur@exemplo.com'],
        dados: opcoes.dados ?? { usuario: { nome: 'Arthur' } },
        posEnvio,
      }),
    ),
  };
  const arquivos = opcoes.arquivos ?? {
    [ANEXO]: { arquivo: 'arquivos/a.pdf', nomeOriginal: 'contrato.pdf' },
    [LOGO]: { arquivo: 'arquivos/b.png', nomeOriginal: 'logo.png' },
  };
  const arquivosRepository = { findById: vi.fn((id: string) => Promise.resolve(arquivos[id] ?? null)) };
  const storage = { path: vi.fn((key: string) => `/uploads/${key}`) };
  const mailer = { enviar: vi.fn(() => Promise.resolve()) };

  const service = new SendService(
    repository as unknown as IEmailTemplatesRepository,
    arquivosRepository as unknown as IArquivosRepository,
    storage as unknown as IFileStorage,
    mailer,
    resolver as unknown as UsuarioCriadoResolver,
  );
  return { service, resolver, mailer, posEnvio };
}

describe('SendService', () => {
  it('compila assunto e HTML, anexa e manda para o destinatário sugerido, com os fixos em cópia', async () => {
    const { service, mailer, posEnvio } = montar();

    const resposta = await service.execute('usuario_criado', { ids: ['u-9'] }, 'u-1');

    expect(mailer.enviar).toHaveBeenCalledWith({
      to: ['arthur@exemplo.com'],
      cc: ['equipe@exemplo.com'],
      subject: 'Bem-vindo, Arthur',
      html: `<p>Olá, Arthur</p><img src="cid:${LOGO}">`,
      text: 'Olá, Arthur',
      attachments: [
        { filename: 'contrato.pdf', path: '/uploads/arquivos/a.pdf' },
        { filename: 'logo.png', path: '/uploads/arquivos/b.png', cid: LOGO },
      ],
    });
    expect(posEnvio).toHaveBeenCalledWith(['arthur@exemplo.com']);
    expect(resposta).toMatchObject({ status: 200, data: { destinatarios: ['arthur@exemplo.com'] } });
  });

  it('destinatários informados valem sobre os sugeridos', async () => {
    const { service, mailer } = montar();

    await service.execute('usuario_criado', { ids: ['u-9'], destinatarios: ['outro@exemplo.com'] }, 'u-1');

    expect(mailer.enviar).toHaveBeenCalledWith(expect.objectContaining({ to: ['outro@exemplo.com'] }));
  });

  it('sem informado nem sugerido, vão os fixos, sem repetir em cópia', async () => {
    const { service, mailer } = montar({ sugeridos: [] });

    await service.execute('usuario_criado', { ids: ['u-9'] }, 'u-1');

    expect(mailer.enviar).toHaveBeenCalledWith(expect.objectContaining({ to: ['equipe@exemplo.com'], cc: [] }));
  });

  it('nenhum destinatário, 422 SEM_DESTINATARIO sem enviar', async () => {
    const { service, mailer } = montar({ sugeridos: [], template: { ...templateBase, destinatariosFixos: [] } });

    await expect(service.execute('usuario_criado', { ids: ['u-9'] }, 'u-1')).rejects.toMatchObject({
      code: 'SEM_DESTINATARIO',
    });
    expect(mailer.enviar).not.toHaveBeenCalled();
  });

  it('dado com HTML sai escapado', async () => {
    const { service, mailer } = montar({ dados: { usuario: { nome: '<script>x</script>' } } });

    await service.execute('usuario_criado', { ids: ['u-9'] }, 'u-1');

    const [[mensagem]] = mailer.enviar.mock.calls as unknown as [[{ html: string }]];
    expect(mensagem.html).toContain('&lt;script&gt;');
    expect(mensagem.html).not.toContain('<script>');
  });

  it('flag inexistente, template não publicado ou desligado, 404 sem resolver nem enviar', async () => {
    for (const [flag, template] of [
      ['nao_existe', templateBase],
      ['usuario_criado', null],
      ['usuario_criado', { ...templateBase, isActive: false }],
    ] as const) {
      const { service, resolver, mailer } = montar({ template });

      await expect(service.execute(flag, { ids: [] }, 'u-1')).rejects.toBeInstanceOf(NotFoundError);
      expect(resolver.execute).not.toHaveBeenCalled();
      expect(mailer.enviar).not.toHaveBeenCalled();
    }
  });

  it('anexo apagado depois da publicação, 422 ANEXO_INEXISTENTE sem enviar', async () => {
    const { service, mailer } = montar({ arquivos: {} });

    await expect(service.execute('usuario_criado', { ids: ['u-9'] }, 'u-1')).rejects.toMatchObject({
      code: 'ANEXO_INEXISTENTE',
    });
    expect(mailer.enviar).not.toHaveBeenCalled();
  });
});
