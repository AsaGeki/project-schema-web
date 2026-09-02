import { logger } from '@shared/services/LoggerService';

import type { NextFunction, Request, Response } from 'express';

const log = logger.child({ prefix: 'http' });

/**
 * Registra cada requisição depois da resposta enviada, com método, rota, status
 * e duração. Fica ligado por `ENABLE_ROUTER_MONITORING`.
 */
export function logRouterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} - ${elapsedMs.toFixed(1)}ms`;

    if (res.statusCode >= 500) {
      log.error(line);
    } else if (res.statusCode >= 400) {
      log.warn(line);
    } else {
      log.info(line);
    }
  });

  next();
}
