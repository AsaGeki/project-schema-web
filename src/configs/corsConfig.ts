import { env, isProduction } from '@configs/envConfig';
import { ForbiddenError } from '@shared/errors/UniversalError';

import type { CorsOptions } from 'cors';

/**
 * `CORS` aceita lista separada por vírgula, ou `*` para liberar qualquer origem.
 */
function allowedOrigins(): string[] {
  return env.server.CORS.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = allowedOrigins();

    // Requisição sem `Origin` (server-to-server, cliente HTTP) não é bloqueada.
    if (!origin || allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }

    // ForbiddenError, e não Error cru: o `errorMiddleware` só devolve 403 no
    // formato padrão da API se o erro for um UniversalError.
    return callback(new ForbiddenError({ message: `Origin '${origin}' não permitida pelo CORS.` }));
  },
  // Cookie entre origens só em produção; em desenvolvimento o front costuma
  // passar por proxy na mesma origem.
  credentials: isProduction,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
