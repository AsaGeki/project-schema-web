import { afterEach, describe, expect, it, vi } from 'vitest';

import { cifrarValorCookie, decifrarValorCookie } from '@shared/utils/auth/cookieCrypto';

describe('cookieCrypto', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('decifra o que cifrou, e o texto não aparece no valor cifrado', () => {
    const cifrado = cifrarValorCookie('eyJ.token.jwt');

    expect(cifrado).not.toContain('eyJ');
    expect(decifrarValorCookie(cifrado)).toBe('eyJ.token.jwt');
  });

  it('o mesmo valor cifrado duas vezes sai diferente', () => {
    expect(cifrarValorCookie('igual')).not.toBe(cifrarValorCookie('igual'));
  });

  it('valor adulterado ou fora do formato devolve undefined', () => {
    const [iv, cifrado, tag] = cifrarValorCookie('token').split('.');

    expect(decifrarValorCookie(`${iv}.${cifrado}x.${tag}`)).toBeUndefined();
    expect(decifrarValorCookie('sem-pontos')).toBeUndefined();
    expect(decifrarValorCookie('')).toBeUndefined();
  });

  it('valor cifrado com outra chave devolve undefined', async () => {
    const cifrado = cifrarValorCookie('token');

    vi.resetModules();
    vi.stubEnv('TOKEN_COOKIE_ENCRYPTION_KEY', 'outra-chave-com-pelo-menos-32-caracteres!!');
    const outra = await import('@shared/utils/auth/cookieCrypto.js');

    expect(outra.decifrarValorCookie(cifrado)).toBeUndefined();
  });
});
