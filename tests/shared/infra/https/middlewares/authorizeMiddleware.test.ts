import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '@shared/errors/UniversalError';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';

import type { Request, Response } from 'express';

function requisicao(abilities: string[]): Request {
  return { user: { id: 'u-1', abilities } } as unknown as Request;
}

describe('authorize', () => {
  it('segue quando o usuário tem todas as permissões exigidas', () => {
    const next = vi.fn();

    authorize('users:read')(requisicao(['users:read']), {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('acesso total segue', () => {
    const next = vi.fn();

    authorize('perfis:delete')(requisicao(['*']), {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('sem a permissão, 403 com a permissão exigida na mensagem', () => {
    const next = vi.fn();

    expect(() => authorize('users:read')(requisicao([]), {} as Response, next)).toThrow(ForbiddenError);
    expect(() => authorize('users:read')(requisicao([]), {} as Response, next)).toThrow('users:read');
    expect(next).not.toHaveBeenCalled();
  });
});
