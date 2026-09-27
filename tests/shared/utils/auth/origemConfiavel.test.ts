import { afterEach, describe, expect, it, vi } from 'vitest';

async function carregar(origens: string) {
  vi.resetModules();
  vi.stubEnv('ALLOWED_RETURN_ORIGINS', origens);
  return (await import('@shared/utils/auth/origemConfiavel.js')).origemConfiavel;
}

describe('origemConfiavel', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('devolve a URL quando a origem está em ALLOWED_RETURN_ORIGINS', async () => {
    const origemConfiavel = await carregar('https://app.exemplo.com');

    expect(origemConfiavel('https://app.exemplo.com/painel')).toBe('https://app.exemplo.com/painel');
  });

  it('origem fora da lista, protocolo perigoso ou valor que não é texto devolve undefined', async () => {
    const origemConfiavel = await carregar('https://app.exemplo.com');

    expect(origemConfiavel('https://atacante.com/')).toBeUndefined();
    expect(origemConfiavel('javascript:alert(1)')).toBeUndefined();
    expect(origemConfiavel(['https://app.exemplo.com'])).toBeUndefined();
  });
});
