import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type IMailer from '@shared/infra/mail/IMailer';

const { post } = vi.hoisted(() => ({
  post: vi.fn<(url: string, corpo?: unknown, config?: unknown) => Promise<unknown>>(),
}));

vi.mock('axios', () => ({ default: { post } }));

const CONFIGURADO = {
  GRAPH_TENANT_ID: 'tenant',
  GRAPH_CLIENT_ID: 'cliente',
  GRAPH_CLIENT_SECRET: 'segredo',
  GRAPH_SENDER: 'envio@exemplo.com',
};

let pasta: string;

async function carregar(variaveis: Record<string, string>) {
  vi.resetModules();
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);

  post.mockReset();
  const GraphMailer = (await import('@shared/infra/mail/GraphMailer.js')).default as unknown as new () => IMailer;

  return { post, mailer: new GraphMailer() };
}

function erroHttp(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } });
}

describe('GraphMailer', () => {
  beforeAll(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'graph-mailer-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it('sem configuração, 503 EMAIL_NAO_CONFIGURADO sem chamar o Graph', async () => {
    const { post, mailer } = await carregar({});

    await expect(mailer.enviar({ to: ['a@exemplo.com'], subject: 's', html: 'h', text: 't' })).rejects.toMatchObject({
      status: 503,
      code: 'EMAIL_NAO_CONFIGURADO',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('envia com os anexos em base64, a imagem inline pelo cid, e reaproveita o token', async () => {
    const { post, mailer } = await carregar(CONFIGURADO);
    post.mockImplementation(url =>
      Promise.resolve(url.includes('/oauth2/') ? { data: { access_token: 'tk', expires_in: 3600 } } : { data: {} }),
    );
    const pdf = path.join(pasta, 'contrato.pdf');
    await fs.writeFile(pdf, '%PDF-1.4\n%%EOF\n');

    const opcoes = {
      to: ['a@exemplo.com'],
      cc: ['b@exemplo.com'],
      subject: 'Assunto',
      html: '<img src="cid:logo">',
      text: '',
      attachments: [
        { filename: 'contrato.pdf', path: pdf },
        { filename: 'logo.pdf', path: pdf, cid: 'logo' },
      ],
    };
    await mailer.enviar(opcoes);
    await mailer.enviar(opcoes);

    const chamadas = post.mock.calls;
    expect(chamadas.filter(([url]) => url.includes('/oauth2/'))).toHaveLength(1);
    const [url, corpo, config] = chamadas[1] as [string, { message: Record<string, unknown> }, { headers: object }];
    expect(url).toBe('https://graph.microsoft.com/v1.0/users/envio%40exemplo.com/sendMail');
    expect(config.headers).toMatchObject({ Authorization: 'Bearer tk' });
    expect(corpo.message).toMatchObject({
      subject: 'Assunto',
      toRecipients: [{ emailAddress: { address: 'a@exemplo.com' } }],
      ccRecipients: [{ emailAddress: { address: 'b@exemplo.com' } }],
      attachments: [
        {
          name: 'contrato.pdf',
          contentType: 'application/pdf',
          contentBytes: Buffer.from('%PDF-1.4\n%%EOF\n').toString('base64'),
        },
        { name: 'logo.pdf', isInline: true, contentId: 'logo' },
      ],
    });
  });

  it('credencial recusada no login, 500 EMAIL_ACESSO_NEGADO', async () => {
    const { post, mailer } = await carregar(CONFIGURADO);
    post.mockRejectedValue(erroHttp(401));

    await expect(mailer.enviar({ to: ['a@exemplo.com'], subject: 's', html: 'h', text: 't' })).rejects.toMatchObject({
      status: 500,
      code: 'EMAIL_ACESSO_NEGADO',
    });
  });

  it('Graph fora do ar no envio, 503 EMAIL_INDISPONIVEL', async () => {
    const { post, mailer } = await carregar(CONFIGURADO);
    post.mockImplementation(url =>
      url.includes('/oauth2/')
        ? Promise.resolve({ data: { access_token: 'tk', expires_in: 3600 } })
        : Promise.reject(erroHttp(503)),
    );

    await expect(mailer.enviar({ to: ['a@exemplo.com'], subject: 's', html: 'h', text: 't' })).rejects.toMatchObject({
      status: 503,
      code: 'EMAIL_INDISPONIVEL',
    });
  });
});
