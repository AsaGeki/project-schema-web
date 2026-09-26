import { afterEach, describe, expect, it, vi } from 'vitest';

/** Reimporta a config com o ambiente informado: ela é montada uma vez, no import. */
async function carregarComAmbiente(variaveis: Record<string, string>) {
  vi.resetModules();
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);

  const { apiKeysConfig } = await import('./apiKeysConfig.js');
  return apiKeysConfig;
}

describe('apiKeysConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('lê pares id:segredo separados por vírgula, aparando espaços', async () => {
    const config = await carregarComAmbiente({ API_KEYS_HMAC: 'erp:s1, crm : s2 ' });

    expect(config.keys).toEqual({ erp: 's1', crm: 's2' });
  });

  it('descarta entrada malformada em vez de aceitar credencial parcial', async () => {
    const config = await carregarComAmbiente({ API_KEYS_HMAC: 'erp:s1,sem-segredo,:sem-id,a:b:c' });

    expect(config.keys).toEqual({ erp: 's1' });
  });

  it('usa a tolerância de API_KEYS_HMAC_TOLERANCIA_MS, com 5 minutos por padrão', async () => {
    expect((await carregarComAmbiente({ API_KEYS_HMAC_TOLERANCIA_MS: '1000' })).toleranceMs).toBe(1000);
    vi.unstubAllEnvs();
    expect((await carregarComAmbiente({})).toleranceMs).toBe(300000);
  });
});
