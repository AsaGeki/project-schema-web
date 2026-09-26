import { describe, expect, it, vi } from 'vitest';

import { sendResponse } from './sendResponse';

import type { Response } from 'express';

function criarResponse() {
  const res = { status: vi.fn(), set: vi.fn(), json: vi.fn(), end: vi.fn() };
  res.status.mockReturnValue(res);
  res.set.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.end.mockReturnValue(res);
  return res;
}

describe('sendResponse', () => {
  it('leva o status para a linha de status e os headers para a resposta, fora do corpo', () => {
    const res = criarResponse();

    sendResponse(res as unknown as Response, {
      success: true,
      status: 201,
      message: 'Criado',
      data: { id: '1' },
      headers: { Location: '/api/users/1' },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.set).toHaveBeenCalledWith({ Location: '/api/users/1' });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Criado', data: { id: '1' } });
  });

  it('mantém os campos de paginação na raiz do corpo', () => {
    const res = criarResponse();

    sendResponse(res as unknown as Response, {
      success: true,
      status: 200,
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
    });
  });

  it.each([204, 304])('encerra o %i sem corpo', status => {
    const res = criarResponse();

    sendResponse(res as unknown as Response, { success: true, status });

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.end).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });
});
