import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import converterImagem from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { otimizarImagem } from '@shared/utils/files/otimizarImagem';

let pasta: string;

describe('otimizarImagem', () => {
  beforeAll(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'otimizar-imagem-'));
  });

  afterAll(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it('limita o lado maior a 2560px e regrava sem EXIF, no mesmo formato', async () => {
    const origem = path.join(pasta, 'foto.jpg');
    await converterImagem({ create: { width: 3000, height: 100, channels: 3, background: '#f00' } })
      .withExif({ IFD0: { Copyright: 'teste' } })
      .jpeg()
      .toFile(origem);
    expect((await converterImagem(origem).metadata()).exif).toBeDefined();

    const destino = await otimizarImagem(origem, 'jpg');
    const metadados = await converterImagem(destino).metadata();

    expect(metadados).toMatchObject({ format: 'jpeg', width: 2560 });
    expect(metadados.exif).toBeUndefined();
    await expect(fs.access(origem)).resolves.toBeUndefined();
  });

  it('imagem menor que o limite não aumenta', async () => {
    const origem = path.join(pasta, 'pequena.png');
    await converterImagem({ create: { width: 100, height: 50, channels: 3, background: '#00f' } })
      .png()
      .toFile(origem);

    const metadados = await converterImagem(await otimizarImagem(origem, 'png')).metadata();

    expect(metadados).toMatchObject({ format: 'png', width: 100, height: 50 });
  });
});
