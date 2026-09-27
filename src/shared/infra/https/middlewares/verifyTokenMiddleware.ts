import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';

import { env } from '@configs/envConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';
import { readAccessToken } from '@shared/utils/auth/cookies';

import type { NextFunction, Request, Response } from 'express';

interface ITokenPayload {
  sub: string;
}

/**
 * Valida o access token — do header `Authorization` ou, na falta dele, do
 * cookie de sessão — e resolve as permissões do usuário pelos perfis dele,
 * populando `req.user`. Token ausente, inválido ou de usuário que não existe
 * mais vira 401 — o `errorMiddleware` traduz.
 */
export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : readAccessToken(req);

  if (!token) {
    throw new UnauthorizedError({ message: 'Token de autenticação não informado.' });
  }

  let payload: ITokenPayload;

  try {
    payload = jwt.verify(token, env.auth.JWT_SECRET) as ITokenPayload;
  } catch {
    throw new UnauthorizedError({ message: 'Sessão expirada. Por favor, faça login novamente.' });
  }

  const abilities = await container.resolve<IResolvedorDePermissoes>('ResolvedorDePermissoes').execute(payload.sub);

  if (!abilities) {
    throw new UnauthorizedError({ message: 'O usuário desta sessão não existe mais.' });
  }

  req.user = { id: payload.sub, abilities };
  next();
}
