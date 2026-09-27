import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { Arquivo } from '@modules/arquivos/infra/mongo/models/Arquivo';
import ArquivosRepository from '@modules/arquivos/infra/mongo/repositories/ArquivosRepository';

const repository = new ArquivosRepository();

const registro = (createdBy: string, hashSha256: string) => ({
  nomeOriginal: 'relatório.pdf',
  arquivo: `arquivos/${createdBy}-${hashSha256}.pdf`,
  mimeType: 'application/pdf',
  tamanhoBytes: 10,
  hashSha256,
  createdBy,
});

describe('ArquivosRepository (Mongo real)', () => {
  beforeAll(async () => {
    await connectMongo();
    await Arquivo.init();
  });

  beforeEach(async () => {
    await Arquivo.deleteMany({});
  });

  afterAll(async () => {
    await Arquivo.deleteMany({});
    await disconnectMongo();
  });

  it('o mesmo usuário não grava o mesmo conteúdo duas vezes', async () => {
    await repository.insertMany([registro('u-1', 'h1')]);

    await expect(repository.insertMany([registro('u-1', 'h1')])).rejects.toMatchObject({ code: 11000 });
  });

  it('usuários diferentes podem ter o mesmo conteúdo', async () => {
    await repository.insertMany([registro('u-1', 'h1'), registro('u-2', 'h1')]);

    expect(await repository.count()).toBe(2);
  });

  it('o JSON traz a rota de download e não repete o id', async () => {
    const [criado] = await repository.insertMany([registro('u-1', 'h1')]);
    const json = JSON.parse(JSON.stringify(criado)) as Record<string, unknown>;

    expect(json).toMatchObject({ nomeOriginal: 'relatório.pdf', url: `/api/arquivos/${String(criado?._id)}/arquivo` });
    expect(json).not.toHaveProperty('id');
  });
});
