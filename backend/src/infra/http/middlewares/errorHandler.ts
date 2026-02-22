import logger from '@config/logger';
import { AppError } from '@shared/errors';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware global de tratamento de erros
 * Deve ser registrado por último no Express
 * Padrão referência: universal/PADRAO-MIDDLEWARES.md
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error({
    err,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
};
