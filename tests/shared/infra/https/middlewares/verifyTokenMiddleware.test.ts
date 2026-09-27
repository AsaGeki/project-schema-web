import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@configs/envConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';

import type { Request, Response } from 'express';

const resolvedor = { execute: vi.fn<IResolvedorDePermissoes['execute']>() };

function requisicao(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe('verifyToken', () => {
  beforeEach(() => {
    resolvedor.execute.mockReset();
    container.registerInstance<IResolvedorDePermissoes>('ResolvedorDePermissoes', resolvedor);
  });

  it('popula req.user com o id do token e as permissões resolvidas', async () => {
    resolvedor.execute.mockResolvedValue(['users:read']);
    const req = requisicao(`Bearer ${jwt.sign({ sub: 'u-1' }, env.auth.JWT_SECRET)}`);
    const next = vi.fn();

    await verifyToken(req, {} as Response, next);

    expect(req.user).toEqual({ id: 'u-1', abilities: ['users:read'] });
    expect(resolvedor.execute).toHaveBeenCalledWith('u-1');
    expect(next).toHaveBeenCalledOnce();
  });

  it('sem token, 401', async () => {
    await expect(verifyToken(requisicao(), {} as Response, vi.fn())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('token assinado com outro segredo, 401 sem consultar permissões', async () => {
    const req = requisicao(`Bearer ${jwt.sign({ sub: 'u-1' }, 'outro-segredo')}`);

    await expect(verifyToken(req, {} as Response, vi.fn())).rejects.toBeInstanceOf(UnauthorizedError);
    expect(resolvedor.execute).not.toHaveBeenCalled();
  });

  it('token de usuário que não existe mais, 401', async () => {
    resolvedor.execute.mockResolvedValue(null);
    const req = requisicao(`Bearer ${jwt.sign({ sub: 'removido' }, env.auth.JWT_SECRET)}`);

    await expect(verifyToken(req, {} as Response, vi.fn())).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
