import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { descartarTemporarios } from '@shared/utils/files/descartarTemporarios';

let pasta: string;

describe('descartarTemporarios', () => {
  beforeAll(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'descartar-temporarios-'));
  });

  afterAll(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it('apaga os arquivos, e caminho que já não existe não falha', async () => {
    const existente = path.join(pasta, 'a.tmp');
    await fs.writeFile(existente, 'x');

    await descartarTemporarios([existente, path.join(pasta, 'nunca-existiu.tmp')]);

    await expect(fs.access(existente)).rejects.toThrow();
  });
});
