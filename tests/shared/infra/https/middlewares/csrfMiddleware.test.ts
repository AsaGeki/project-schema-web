import { describe, expect, it, vi } from 'vitest';

import { env } from '@configs/envConfig';
import { ForbiddenError } from '@shared/errors/UniversalError';
import { CSRF_HEADER, csrfMiddleware } from '@shared/infra/https/middlewares/csrfMiddleware';

import type { Request, Response } from 'express';

function passou(method: string, path: string, headers: Record<string, string> = {}): boolean {
  const next = vi.fn();
  csrfMiddleware({ method, path, headers } as unknown as Request, {} as Response, next);
  return next.mock.calls.length === 1;
}

describe('csrfMiddleware', () => {
  it('método que altera estado sem o header, 403', () => {
    expect(() => passou('POST', '/api/users')).toThrow(ForbiddenError);
    expect(() => passou('DELETE', '/api/arquivos/1', { [CSRF_HEADER]: 'outro-valor' })).toThrow(ForbiddenError);
  });

  it('com o header certo, segue', () => {
    expect(passou('PUT', '/api/users/1', { [CSRF_HEADER]: env.auth.CSRF_HEADER_VALUE })).toBe(true);
  });

  it('GET, HEAD e OPTIONS seguem sem o header', () => {
    expect(['GET', 'HEAD', 'OPTIONS'].every(metodo => passou(metodo, '/api/users'))).toBe(true);
  });

  it('rota interna HMAC segue sem o header', () => {
    expect(passou('POST', '/api/internal/echo')).toBe(true);
  });

  it('requisição com Authorization segue sem o header: o Bearer não vai sozinho de outro site', () => {
    expect(passou('POST', '/api/perfis', { authorization: 'Bearer x' })).toBe(true);
  });

  it('Authorization que não é Bearer não dispensa o header: Basic o navegador reenvia sozinho', () => {
    expect(() => passou('POST', '/api/perfis', { authorization: 'Basic dXNlcjpzZW5oYQ==' })).toThrow(ForbiddenError);
  });
});
