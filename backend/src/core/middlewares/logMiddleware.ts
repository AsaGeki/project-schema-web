import { logger } from '@core/utils/logger';
import { NextFunction, Request, Response } from 'express';

const log = logger.child({ prefix: 'http' });

export function logMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`;

    if (res.statusCode >= 500) log.error(message);
    else if (res.statusCode >= 400) log.warn(message);
    else log.info(message);
  });

  next();
}
