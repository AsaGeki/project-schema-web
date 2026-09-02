import { rateLimit } from 'express-rate-limit';

import { apiConfig } from '@configs/apiConfig';
import { TooManyRequestsError } from '@shared/errors/UniversalError';

import type { RequestHandler } from 'express';

interface IRateLimiterOptions {
  windowMs: number;
  limit: number;
}

/**
 * Limitador de requisições. Fora de produção vira no-op, para não atrapalhar
 * desenvolvimento e testes manuais. O estouro lança `TooManyRequestsError` para
 * a resposta sair no mesmo formato dos demais erros.
 */
export function createRateLimiter({ windowMs, limit }: IRateLimiterOptions): RequestHandler {
  if (!apiConfig.isProduction) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: () => {
      throw new TooManyRequestsError({ message: 'Muitas requisições. Aguarde um momento e tente novamente.' });
    },
  });
}
