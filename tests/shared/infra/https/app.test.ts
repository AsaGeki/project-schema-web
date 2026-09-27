import mongoose from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AddressInfo } from 'net';

interface IServidorDeTeste {
  url: string;
  fechar: () => Promise<void>;
}

/**
 * Sobe o `AppServer` numa porta livre com o ambiente informado. O `envConfig` é
 * lido no import, então cada cenário reimporta a aplicação; os models do
 * Mongoose saem antes porque o `mongoose` é compartilhado entre os imports.
 */
async function subirApp(variaveis: Record<string, string> = {}): Promise<IServidorDeTeste> {
  vi.resetModules();
  mongoose.deleteModel(/.+/);
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);

  const { AppServer } = await import('@shared/infra/https/app.js');
  const { httpServer } = new AppServer();

  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    fechar: () => new Promise(resolve => httpServer.close(() => resolve())),
  };
}

describe('AppServer', () => {
  let servidor: IServidorDeTeste | undefined;

  afterEach(async () => {
    await servidor?.fechar();
    servidor = undefined;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('GET /api/ responde o envelope sem o status no corpo', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/`);
    const corpo = (await resposta.json()) as Record<string, unknown>;

    expect(resposta.status).toBe(200);
    expect(corpo).toMatchObject({ success: true, data: { environment: 'test' } });
    expect(corpo).not.toHaveProperty('status');
  });

  it('GET /api/health responde ok com os bancos desligados', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/health`);
    const corpo = (await resposta.json()) as { data: { status: string; dependencies: unknown } };

    expect(resposta.status).toBe(200);
    expect(corpo.data.status).toBe('ok');
    expect(corpo.data.dependencies).toEqual({ postgres: 'off', mongo: 'off' });
  });

  it('corpo inválido vira 422 no formato de erro padrão', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const corpo = (await resposta.json()) as Record<string, unknown>;

    expect(resposta.status).toBe(422);
    expect(corpo).toMatchObject({ success: false, code: 'VALIDATION_FAILED' });
  });

  it('marca Vary: Accept-Encoding, pela compressão', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/`, { headers: { 'Accept-Encoding': 'gzip' } });

    expect(resposta.headers.get('vary')).toContain('Accept-Encoding');
  });

  describe('TRUST_PROXY em produção', () => {
    async function avisoDeProxyAposRequisicao(trustProxy: string): Promise<boolean> {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      servidor = await subirApp({ NODE_ENV: 'production', TRUST_PROXY: trustProxy });

      await fetch(`${servidor.url}/api/`, { headers: { 'X-Forwarded-For': '6.6.6.6' } });

      return consoleError.mock.calls.some(argumentos =>
        argumentos.some(argumento => String(argumento).includes('ERR_ERL_UNEXPECTED_X_FORWARDED_FOR')),
      );
    }

    it('com 0, o rate limit avisa que chegou X-Forwarded-For sem proxy configurado', async () => {
      expect(await avisoDeProxyAposRequisicao('0')).toBe(true);
    });

    it('com 1, o header é confiável e não há aviso', async () => {
      expect(await avisoDeProxyAposRequisicao('1')).toBe(false);
    });
  });
});
