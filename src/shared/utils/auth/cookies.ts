import sessionConfig from '@configs/sessionConfig';
import { cifrarValorCookie, decifrarValorCookie } from '@shared/utils/auth/cookieCrypto';

import type { CookieOptions, Request, Response } from 'express';

/** Par de tokens gravado nos cookies. */
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Validade do cookie do access token; sem ela, o cookie vive até o navegador fechar. */
  accessTokenTtlMs?: number;
}

/**
 * Lax, não Strict: com Strict, navegação iniciada em outro site (link de
 * e-mail, retorno de login) chega sem cookie. CSRF fica com o `csrfMiddleware`.
 * A limpeza repete estes atributos: o navegador só descarta o cookie quando
 * eles batem com os da gravação.
 */
const atributos: CookieOptions = {
  httpOnly: true,
  secure: sessionConfig.secure,
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(res: Response, tokens: IAuthTokens): void {
  res.cookie(sessionConfig.accessTokenCookieName, cifrarValorCookie(tokens.accessToken), {
    ...atributos,
    maxAge: tokens.accessTokenTtlMs,
  });
  res.cookie(sessionConfig.refreshTokenCookieName, cifrarValorCookie(tokens.refreshToken), {
    ...atributos,
    maxAge: sessionConfig.refreshTokenCookieTtlMs,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(sessionConfig.accessTokenCookieName, atributos);
  res.clearCookie(sessionConfig.refreshTokenCookieName, atributos);
}

function lerCookie(req: Request, nome: string): string | undefined {
  const bruto = (req.cookies as Record<string, string | undefined>)[nome];

  return bruto ? decifrarValorCookie(bruto) : undefined;
}

export function readAccessToken(req: Request): string | undefined {
  return lerCookie(req, sessionConfig.accessTokenCookieName);
}

export function readRefreshToken(req: Request): string | undefined {
  return lerCookie(req, sessionConfig.refreshTokenCookieName);
}
