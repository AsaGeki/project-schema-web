import { ZodError } from 'zod';

import { env } from '@configs/envConfig';
import { isMongoError, mapMongoError } from '@shared/errors/MongoErrors';
import { isPrismaError, mapPrismaError } from '@shared/errors/PrismaErrors';
import {
  BadRequestError,
  PayloadTooLargeError,
  UniversalError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';

import type { NextFunction, Request, Response } from 'express';

const log = logger.child({ prefix: 'error' });

/**
 * Erros do body-parser (`express.json`) chegam antes das rotas e trazem `type`
 * identificando a causa. Traduzimos para `UniversalError` para sair no formato
 * de erro padrão da API.
 */
function mapBodyParserError(error: Error): UniversalError | null {
  const type = (error as { type?: string }).type;

  switch (type) {
    case 'entity.parse.failed':
      return new BadRequestError({ message: 'Corpo da requisição não é um JSON válido.' });
    case 'entity.too.large':
      return new PayloadTooLargeError({ message: 'Corpo da requisição excede o tamanho máximo permitido.' });
    case 'charset.unsupported':
    case 'encoding.unsupported':
      return new UnsupportedMediaTypeError({ message: 'Charset ou encoding do corpo não é suportado.' });
    default:
      return null;
  }
}

export default function errorMiddleware(error: Error, req: Request, res: Response, _next: NextFunction): Response {
  const ipRequest = req.ip || 'desconhecido';

  const mapped = resolveError(error);

  if (mapped) {
    log.warn(`[${ipRequest}] ${req.method} ${req.originalUrl}: ${mapped.title} - ${mapped.message}`);
    return res.status(mapped.status).json({ success: false, ...mapped.toJSON() });
  }

  log.error(`[${ipRequest}] ${req.method} ${req.originalUrl}: erro não mapeado — ${error.message}`, {
    stack: error.stack,
  });

  return res.status(500).json({
    success: false,
    title: 'Erro interno do servidor!',
    message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    // Em produção o erro real não é exposto ao cliente.
    ...(env.NODE_ENV !== 'prod' && { error: error.message }),
  });
}

/** Devolve o `UniversalError` correspondente, ou `null` quando o erro é desconhecido. */
function resolveError(error: Error): UniversalError | null {
  if (error instanceof UniversalError) return error;

  if (error instanceof ZodError) {
    return new UnprocessableEntityError({
      message: 'Erro de validação dos dados fornecidos.',
      code: 'VALIDATION_FAILED',
      details: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (isPrismaError(error)) return mapPrismaError(error);
  if (isMongoError(error)) return mapMongoError(error);

  return mapBodyParserError(error);
}
