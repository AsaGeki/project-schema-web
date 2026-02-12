import logger from '@config/logger';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware HTTP Logger usando Pino
 * Registra todas as requisições HTTP com informações relevantes
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Captura quando a resposta termina
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    logger[logLevel]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
};
