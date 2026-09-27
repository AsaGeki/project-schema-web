import { env } from '@configs/envConfig';
import { ForbiddenError } from '@shared/errors/UniversalError';

import type { NextFunction, Request, Response } from 'express';

/**
 * Header que o front manda em toda chamada que altera estado. O valor não é
 * segredo: prova que a requisição saiu de fetch do próprio front. Um form de
 * outro site dispara POST com o cookie junto, mas não acrescenta header sem
 * passar pelo preflight do CORS, que recusa a origem.
 */
export const CSRF_HEADER = 'x-requested-by';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Rotas autenticadas por HMAC: quem chama é outro backend, sem sessão de navegador. */
const PREFIXO_INTERNO = '/api/internal/';

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (METODOS_SEGUROS.has(req.method)) return next();
  if (req.path.startsWith(PREFIXO_INTERNO)) return next();
  // O navegador não anexa Bearer sozinho, então quem o manda não é um form de outro site. Basic ele reenvia.
  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  if (req.headers[CSRF_HEADER] !== env.auth.CSRF_HEADER_VALUE) {
    throw new ForbiddenError({
      message: 'Requisição bloqueada pela proteção contra CSRF.',
      code: 'CSRF_HEADER_AUSENTE',
    });
  }

  next();
}
