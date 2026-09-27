import { env } from '@configs/envConfig';
import { ForbiddenError } from '@shared/errors/UniversalError';
import { CSRF_HEADER } from '@shared/infra/https/middlewares/csrfMiddleware';

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
  // Cookie entre origens só com lista explícita: com `*`, qualquer site faria requisição com a sessão do usuário.
  credentials: !allowedOrigins().includes('*'),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', CSRF_HEADER],
};
