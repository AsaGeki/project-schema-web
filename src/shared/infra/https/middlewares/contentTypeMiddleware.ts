import { UnsupportedMediaTypeError } from '@shared/errors/UniversalError';

import type { NextFunction, Request, Response } from 'express';

/** Métodos que carregam corpo e por isso exigem `Content-Type`. */
const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

/**
 * Rejeita corpo não-JSON com 415 antes que o body-parser tente interpretar.
 * Requisição sem corpo passa direto — um `POST` vazio é legítimo.
 */
export function enforceJsonContentType(req: Request, _res: Response, next: NextFunction): void {
  if (!METHODS_WITH_BODY.includes(req.method)) return next();

  const hasBody = req.headers['content-length'] !== undefined || req.headers['transfer-encoding'] !== undefined;
  if (!hasBody) return next();

  const contentType = req.headers['content-type'] ?? '';
  // Upload multipart tem o próprio parser e não passa por aqui.
  if (contentType.includes('application/json') || contentType.includes('multipart/form-data')) return next();

  throw new UnsupportedMediaTypeError({ message: 'O corpo da requisição deve ser enviado como application/json.' });
}
