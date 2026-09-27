import { afterEach, describe, expect, it, vi } from 'vitest';

async function carregarEnv(variaveis: Record<string, string>) {
  vi.resetModules();
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);
  return import('@configs/envConfig.js');
}

describe('envConfig — uploads', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('MAX_FILE_SIZE vira bytes', async () => {
    expect((await carregarEnv({ MAX_FILE_SIZE: '50MB' })).env.uploads.MAX_FILE_SIZE_BYTES).toBe(50 * 1024 ** 2);
    expect((await carregarEnv({ MAX_FILE_SIZE: '512KB' })).env.uploads.MAX_FILE_SIZE_BYTES).toBe(512 * 1024);
    expect((await carregarEnv({ MAX_FILE_SIZE: '1.5GB' })).env.uploads.MAX_FILE_SIZE_BYTES).toBe(1.5 * 1024 ** 3);
  });

  it('sem MAX_FILE_SIZE, o padrão é 50MB', async () => {
    expect((await carregarEnv({})).env.uploads.MAX_FILE_SIZE_BYTES).toBe(50 * 1024 ** 2);
  });

  it('tamanho fora do formato derruba o boot', async () => {
    const saida = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(carregarEnv({ MAX_FILE_SIZE: '50 mb' })).rejects.toThrow('process.exit');
    expect(saida).toHaveBeenCalledWith(1);
  });
});
