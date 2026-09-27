import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { Log } from '@modules/logs/infra/mongo/models/Log';
import LogsRepository from '@modules/logs/infra/mongo/repositories/LogsRepository';

const repository = new LogsRepository();

const novoLog = (action: string, message: string) => ({ action, category: 'users', message, createdBy: 'teste' });

describe('LogsRepository (Mongo real)', () => {
  beforeAll(async () => {
    await connectMongo();
  });

  beforeEach(async () => {
    await Log.deleteMany({});
  });

  afterAll(async () => {
    await disconnectMongo();
  });

  it('pagina com os campos na raiz', async () => {
    await repository.insertMany([novoLog('user.create', 'um'), novoLog('user.create', 'dois'), novoLog('user.delete', 'três')]);

    const { items, ...paginacao } = await repository.list({ page: 2, limit: 2 });

    expect(items).toHaveLength(1);
    expect(paginacao).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2, hasNext: false });
  });

  it('filtra só pelo que o filterConfig declara', async () => {
    await repository.insertMany([novoLog('user.create', 'um'), novoLog('user.delete', 'dois')]);

    const filtrado = await repository.list({ page: 1, limit: 10, action: 'user.delete', naoDeclarado: 'x' });

    expect(filtrado.items.map(log => log.action)).toEqual(['user.delete']);
  });

  it('coleção vazia devolve zero páginas', async () => {
    const { items, ...paginacao } = await repository.list({ page: 1, limit: 10 });

    expect(items).toEqual([]);
    expect(paginacao).toMatchObject({ total: 0, totalPages: 0, hasNext: false });
  });
});
