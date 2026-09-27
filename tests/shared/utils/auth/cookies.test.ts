import { describe, expect, it, vi } from 'vitest';

import sessionConfig from '@configs/sessionConfig';
import { cifrarValorCookie } from '@shared/utils/auth/cookieCrypto';
import { clearAuthCookies, readAccessToken, readRefreshToken, setAuthCookies } from '@shared/utils/auth/cookies';

import type { Request, Response } from 'express';

function resposta() {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return { res, response: res as unknown as Response };
}

const atributos = { httpOnly: true, secure: sessionConfig.secure, sameSite: 'lax', path: '/' };

describe('cookies de token', () => {
  it('grava os dois tokens cifrados, httpOnly e SameSite=Lax', () => {
    const { res, response } = resposta();

    setAuthCookies(response, { accessToken: 'acesso', refreshToken: 'renova', accessTokenTtlMs: 60_000 });

    const [[nomeAcesso, valorAcesso, opcoesAcesso], [nomeRenova, , opcoesRenova]] = res.cookie.mock.calls as [
      [string, string, object],
      [string, string, object],
    ];
    expect(nomeAcesso).toBe(sessionConfig.accessTokenCookieName);
    expect(valorAcesso).not.toContain('acesso');
    expect(opcoesAcesso).toEqual({ ...atributos, maxAge: 60_000 });
    expect(nomeRenova).toBe(sessionConfig.refreshTokenCookieName);
    expect(opcoesRenova).toEqual({ ...atributos, maxAge: sessionConfig.refreshTokenCookieTtlMs });
  });

  it('limpa com os mesmos atributos da gravação', () => {
    const { res, response } = resposta();

    clearAuthCookies(response);

    expect(res.clearCookie.mock.calls).toEqual([
      [sessionConfig.accessTokenCookieName, atributos],
      [sessionConfig.refreshTokenCookieName, atributos],
    ]);
  });

  it('lê e decifra os tokens do cookie; ausente ou adulterado devolve undefined', () => {
    const req = {
      cookies: {
        [sessionConfig.accessTokenCookieName]: cifrarValorCookie('acesso'),
        [sessionConfig.refreshTokenCookieName]: 'adulterado',
      },
    } as unknown as Request;

    expect(readAccessToken(req)).toBe('acesso');
    expect(readRefreshToken(req)).toBeUndefined();
    expect(readAccessToken({ cookies: {} } as unknown as Request)).toBeUndefined();
  });
});
