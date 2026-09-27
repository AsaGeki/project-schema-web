import { MulterError } from 'multer';
import { describe, expect, it, vi } from 'vitest';

import errorMiddleware from '@shared/infra/https/middlewares/errorMiddleware';

import type { Request, Response } from 'express';

function responder(error: Error): { status: unknown; corpo: { code?: string; message?: string } } {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const req = { method: 'POST', originalUrl: '/api/arquivos', ip: '127.0.0.1' } as unknown as Request;

  errorMiddleware(error, req, res as unknown as Response, vi.fn());

  return {
    status: res.status.mock.calls[0]?.[0],
    corpo: res.json.mock.calls[0]?.[0] as { code?: string; message?: string },
  };
}

describe('errorMiddleware — multer', () => {
  it('arquivo acima do limite vira 413', () => {
    expect(responder(new MulterError('LIMIT_FILE_SIZE', 'arquivos'))).toMatchObject({
      status: 413,
      corpo: { success: false, code: 'LIMIT_FILE_SIZE' },
    });
  });

  it('arquivos demais num envio vira 400', () => {
    expect(responder(new MulterError('LIMIT_FILE_COUNT'))).toMatchObject({
      status: 400,
      corpo: { code: 'LIMIT_FILE_COUNT' },
    });
  });

  it('campo de arquivo inesperado vira 400 com o nome do campo', () => {
    const { status, corpo } = responder(new MulterError('LIMIT_UNEXPECTED_FILE', 'foto'));

    expect(status).toBe(400);
    expect(corpo.code).toBe('LIMIT_UNEXPECTED_FILE');
    expect(corpo.message).toContain('foto');
  });
});
