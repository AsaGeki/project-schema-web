import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';

import { env } from '@configs/envConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';

import type { NextFunction, Request, Response } from 'express';

interface ITokenPayload {
  sub: string;
}

/**
 * Valida o access token do header `Authorization` e resolve as permissões do
 * usuário pelos perfis dele, populando `req.user`. Token ausente, inválido ou de
 * usuário que não existe mais vira 401 — o `errorMiddleware` traduz.
 */
export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError({ message: 'Token de autenticação não informado.' });
  }

  let payload: ITokenPayload;

  try {
    payload = jwt.verify(header.slice('Bearer '.length).trim(), env.auth.JWT_SECRET) as ITokenPayload;
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
