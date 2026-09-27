import { describe, expect, it } from 'vitest';

import { NotFoundError, ServiceUnavailableError, UniversalError } from '@shared/errors/UniversalError';

describe('ServiceUnavailableError', () => {
  it('responde 503 com título e mensagem padrão, mantendo o code informado', () => {
    const erro = new ServiceUnavailableError({ code: 'EXEMPLO_INDISPONIVEL' });

    expect(erro).toBeInstanceOf(UniversalError);
    expect(erro.status).toBe(503);
    expect(erro.title).toBe('Serviço indisponível!');
    expect(erro.message).toBe('Serviço temporariamente indisponível.');
    expect(erro.code).toBe('EXEMPLO_INDISPONIVEL');
  });

  it('aceita a mensagem como string', () => {
    expect(new ServiceUnavailableError('Serasa fora do ar.').message).toBe('Serasa fora do ar.');
  });
});

describe('UniversalError.toJSON', () => {
  it('serializa sem o status, que vai na linha de status da resposta', () => {
    const json = new NotFoundError({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' }).toJSON();

    expect(json).toEqual({
      name: 'NotFoundError',
      title: 'Não encontrado!',
      message: 'Usuário não encontrado.',
      code: 'USER_NOT_FOUND',
    });
  });
});
