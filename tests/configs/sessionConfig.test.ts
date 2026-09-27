import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ISessionConfig } from '@configs/sessionConfig';

async function carregarSessionConfig(variaveis: Record<string, string>) {
  vi.resetModules();
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);
  // No import() de módulo CommonJS o TypeScript tipa o `default` como o namespace; em runtime é o config.
  return (await import('@configs/sessionConfig.js')).default as unknown as ISessionConfig;
}

describe('sessionConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('origem HTTPS grava Secure e usa o prefixo __Host-', async () => {
    const config = await carregarSessionConfig({ PUBLIC_URL: 'https://app.exemplo.com' });

    expect(config).toMatchObject({
      secure: true,
      accessTokenCookieName: '__Host-access_token',
      refreshTokenCookieName: '__Host-refresh_token',
    });
  });

  it('origem HTTP não usa Secure nem o prefixo', async () => {
    const config = await carregarSessionConfig({ PUBLIC_URL: 'http://localhost:3000' });

    expect(config).toMatchObject({ secure: false, accessTokenCookieName: 'access_token' });
  });

  it('lê a lista de origens de retorno sem espaços nem vazios', async () => {
    const config = await carregarSessionConfig({ ALLOWED_RETURN_ORIGINS: ' https://a.com , ,https://b.com' });

    expect(config.allowedReturnOrigins).toEqual(['https://a.com', 'https://b.com']);
  });
});
