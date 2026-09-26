import { describe, expect, it, vi } from 'vitest';

import { singleFlight } from './singleFlight';

function adiada<T>(valor: T, ms = 10): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(valor), ms));
}

describe('singleFlight', () => {
  it('chamadas concorrentes com a mesma chave executam a função uma vez só', async () => {
    const fn = vi.fn(() => adiada('resultado'));

    const resultados = await Promise.all([
      singleFlight('mesma', fn),
      singleFlight('mesma', fn),
      singleFlight('mesma', fn),
    ]);

    expect(fn).toHaveBeenCalledOnce();
    expect(resultados).toEqual(['resultado', 'resultado', 'resultado']);
  });

  it('chaves diferentes executam separadas', async () => {
    const fn = vi.fn((valor: string) => adiada(valor));

    await Promise.all([singleFlight('a', () => fn('a')), singleFlight('b', () => fn('b'))]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('libera a chave depois de uma falha, e a próxima chamada executa de novo', async () => {
    await expect(singleFlight('falha', () => Promise.reject(new Error('falhou')))).rejects.toThrow('falhou');

    await expect(singleFlight('falha', () => adiada('refeito'))).resolves.toBe('refeito');
  });

  it('libera a chave depois do sucesso, e a próxima chamada executa de novo', async () => {
    const fn = vi.fn(() => adiada('ok'));

    await singleFlight('seguida', fn);
    await singleFlight('seguida', fn);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
