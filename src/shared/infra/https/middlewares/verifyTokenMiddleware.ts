import jwt from 'jsonwebtoken';

import { env } from '@configs/envConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';

import type { NextFunction, Request, Response } from 'express';

interface ITokenPayload {
  sub: string;
  isAdmin: boolean;
}

/**
 * Extrai e valida o access token do header `Authorization`, populando
 * `req.user`. Token ausente, malformado ou expirado vira 401 — o
 * `errorMiddleware` traduz.
 */
export function verifyToken(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError({ message: 'Token de autenticação não informado.' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.auth.JWT_SECRET) as ITokenPayload;
    req.user = { id: payload.sub, isAdmin: payload.isAdmin };
    next();
  } catch {
    throw new UnauthorizedError({ message: 'Sessão expirada. Por favor, faça login novamente.' });
  }
}
