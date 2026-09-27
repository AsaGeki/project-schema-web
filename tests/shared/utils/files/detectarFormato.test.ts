import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import converterImagem from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { detectarFormato } from '@shared/utils/files/detectarFormato';

let pasta: string;

describe('detectarFormato', () => {
  beforeAll(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'detectar-formato-'));
  });

  afterAll(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it('reconhece o PNG pelos bytes, mesmo com nome de PDF', async () => {
    const caminho = path.join(pasta, 'enganoso.pdf');
    await converterImagem({ create: { width: 4, height: 4, channels: 3, background: '#000' } })
      .png()
      .toFile(caminho);

    expect(await detectarFormato(caminho)).toEqual({ ext: 'png', mime: 'image/png' });
  });

  it('texto puro não tem formato reconhecido', async () => {
    const caminho = path.join(pasta, 'texto.png');
    await fs.writeFile(caminho, 'só texto');

    expect(await detectarFormato(caminho)).toBeUndefined();
  });
});
