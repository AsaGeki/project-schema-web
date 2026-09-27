import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@configs/envConfig';
import sessionConfig from '@configs/sessionConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { cifrarValorCookie } from '@shared/utils/auth/cookieCrypto';

import type { Request, Response } from 'express';

const resolvedor = { execute: vi.fn<IResolvedorDePermissoes['execute']>() };

function requisicao(authorization?: string, cookies: Record<string, string> = {}): Request {
  return { headers: { authorization }, cookies } as unknown as Request;
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

  it('sem Authorization, usa o token do cookie', async () => {
    resolvedor.execute.mockResolvedValue(['logs:read']);
    const token = jwt.sign({ sub: 'u-2' }, env.auth.JWT_SECRET);
    const req = requisicao(undefined, { [sessionConfig.accessTokenCookieName]: cifrarValorCookie(token) });
    const next = vi.fn();

    await verifyToken(req, {} as Response, next);

    expect(req.user).toEqual({ id: 'u-2', abilities: ['logs:read'] });
    expect(next).toHaveBeenCalledOnce();
  });

  it('cookie que não decifra, 401', async () => {
    const req = requisicao(undefined, { [sessionConfig.accessTokenCookieName]: 'adulterado' });

    await expect(verifyToken(req, {} as Response, vi.fn())).rejects.toBeInstanceOf(UnauthorizedError);
    expect(resolvedor.execute).not.toHaveBeenCalled();
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
