import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';

import counterModel, { proximaSequencia } from './Counter';

describe('proximaSequencia (Mongo real)', () => {
  beforeAll(async () => {
    await connectMongo();
  });

  beforeEach(async () => {
    await counterModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectMongo();
  });

  it('começa em 1 numa chave nova', async () => {
    expect(await proximaSequencia('pedidos')).toBe(1);
  });

  it('20 chamadas concorrentes numa chave nova recebem 1 a 20, sem repetir', async () => {
    const numeros = await Promise.all(Array.from({ length: 20 }, () => proximaSequencia('concorrente')));

    expect([...numeros].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, indice) => indice + 1));
  });

  it('cada chave tem a própria sequência', async () => {
    await proximaSequencia('a');
    await proximaSequencia('a');

    expect(await proximaSequencia('b')).toBe(1);
    expect(await proximaSequencia('a')).toBe(3);
  });
});
