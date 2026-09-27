import fs from 'fs/promises';
import path from 'path';

import { afterAll, describe, expect, it } from 'vitest';

import { env } from '@configs/envConfig';
import LocalDiskStorage from '@shared/infra/storage/LocalDiskStorage';

const storage = new LocalDiskStorage();
const raiz = path.resolve(env.uploads.UPLOADS_DIR);

async function recebido(conteudo: string): Promise<string> {
  const pasta = path.join(raiz, '.recebendo');
  await fs.mkdir(pasta, { recursive: true });

  const caminho = path.join(pasta, `storage-${Date.now()}-${Math.random()}`);
  await fs.writeFile(caminho, conteudo);

  return caminho;
}

describe('LocalDiskStorage', () => {
  afterAll(async () => {
    await fs.rm(path.join(raiz, 'storage-teste'), { recursive: true, force: true });
  });

  it('move o arquivo para o diretório com nome gerado e devolve a key relativa', async () => {
    const origem = await recebido('conteúdo');

    const key = await storage.save(origem, 'storage-teste', 'pdf');

    expect(key).toMatch(/^storage-teste\/[0-9a-f-]{36}\.pdf$/);
    expect(await fs.readFile(storage.path(key), 'utf8')).toBe('conteúdo');
    await expect(fs.access(origem)).rejects.toThrow();
  });

  it('path resolve a key dentro de UPLOADS_DIR', () => {
    expect(storage.path('storage-teste/x.pdf')).toBe(path.join(raiz, 'storage-teste/x.pdf'));
  });

  it('remove apaga o arquivo, e remover de novo não falha', async () => {
    const key = await storage.save(await recebido('x'), 'storage-teste', 'txt');

    await storage.remove(key);

    await expect(fs.access(storage.path(key))).rejects.toThrow();
    await expect(storage.remove(key)).resolves.toBeUndefined();
  });
});
