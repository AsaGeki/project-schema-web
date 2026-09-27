import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { env } from '@configs/envConfig';
import sessionConfig from '@configs/sessionConfig';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';
import { CSRF_HEADER } from '@shared/infra/https/middlewares/csrfMiddleware';
import { cifrarValorCookie } from '@shared/utils/auth/cookieCrypto';

import { type IServidorDeTeste, subirApp } from '../../../subirApp';

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
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: env.auth.CSRF_HEADER_VALUE },
      body: JSON.stringify({}),
    });
    const corpo = (await resposta.json()) as Record<string, unknown>;

    expect(resposta.status).toBe(422);
    expect(corpo).toMatchObject({ success: false, code: 'VALIDATION_FAILED' });
  });

  it('POST com cookie e sem o header do front vira 403 de CSRF', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'access_token=qualquer' },
      body: JSON.stringify({}),
    });

    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toMatchObject({ code: 'CSRF_HEADER_AUSENTE' });
  });

  describe('CORS', () => {
    it('com lista explícita, libera credencial e o header do CSRF', async () => {
      servidor = await subirApp({ CORS: 'https://front.exemplo.com' });

      const resposta = await fetch(`${servidor.url}/api/users`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://front.exemplo.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,x-requested-by',
        },
      });

      expect(resposta.headers.get('access-control-allow-credentials')).toBe('true');
      expect(resposta.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('x-requested-by');
    });

    it('com *, não libera credencial', async () => {
      servidor = await subirApp({ CORS: '*' });

      const resposta = await fetch(`${servidor.url}/api/`, { headers: { Origin: 'https://qualquer.com' } });

      expect(resposta.headers.get('access-control-allow-credentials')).toBeNull();
    });
  });

  it('marca Vary: Accept-Encoding, pela compressão', async () => {
    servidor = await subirApp();

    const resposta = await fetch(`${servidor.url}/api/`, { headers: { 'Accept-Encoding': 'gzip' } });

    expect(resposta.headers.get('vary')).toContain('Accept-Encoding');
  });

  describe('autorização', () => {
    function autenticarComo(abilities: string[] | null): string {
      container.registerInstance<IResolvedorDePermissoes>('ResolvedorDePermissoes', {
        execute: () => Promise.resolve(abilities),
      });
      return `Bearer ${jwt.sign({ sub: 'u-1' }, env.auth.JWT_SECRET)}`;
    }

    it('rota com permissão exigida responde 403 sem ela', async () => {
      servidor = await subirApp();

      const resposta = await fetch(`${servidor.url}/api/users`, { headers: { Authorization: autenticarComo([]) } });

      expect(resposta.status).toBe(403);
    });

    it('autentica pelo cookie de access token quando não há Authorization', async () => {
      servidor = await subirApp();
      const bearer = autenticarComo(['perfis:read']);
      const cookie = `${sessionConfig.accessTokenCookieName}=${cifrarValorCookie(bearer.slice('Bearer '.length))}`;

      const resposta = await fetch(`${servidor.url}/api/permissoes`, { headers: { Cookie: cookie } });

      expect(resposta.status).toBe(200);
    });

    it('token de usuário que não existe mais responde 401', async () => {
      servidor = await subirApp();

      const resposta = await fetch(`${servidor.url}/api/users`, { headers: { Authorization: autenticarComo(null) } });

      expect(resposta.status).toBe(401);
    });

    it('com perfis:read, o catálogo de permissões responde 200 sem ir ao banco', async () => {
      servidor = await subirApp();

      const resposta = await fetch(`${servidor.url}/api/permissoes`, {
        headers: { Authorization: autenticarComo(['perfis:read']) },
      });
      const corpo = (await resposta.json()) as { data: { slug: string }[] };

      expect(resposta.status).toBe(200);
      expect(corpo.data.map(grupo => grupo.slug)).toEqual(['users', 'logs', 'perfis', 'arquivos', 'emailTemplates']);
    });
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
