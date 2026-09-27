import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { lerAssinatura } from '@shared/utils/files/lerAssinatura';

let pasta: string;

describe('lerAssinatura', () => {
  beforeAll(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'ler-assinatura-'));
  });

  afterAll(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it('devolve o SHA-256 e o tamanho do conteúdo', async () => {
    const caminho = path.join(pasta, 'abc.txt');
    await fs.writeFile(caminho, 'abc');

    expect(await lerAssinatura(caminho)).toEqual({
      hashSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      tamanhoBytes: 3,
    });
  });
});
