import { describe, expect, it } from 'vitest';

import { isOriginAllowed, sanitizeReturnUrl } from '@shared/utils/url/urlSafety';

describe('sanitizeReturnUrl', () => {
  it('aceita http e https, normalizada', () => {
    expect(sanitizeReturnUrl('https://app.exemplo.com/painel?x=1')).toBe('https://app.exemplo.com/painel?x=1');
    expect(sanitizeReturnUrl('http://localhost:5173')).toBe('http://localhost:5173/');
  });

  it('recusa outro protocolo, URL relativa, vazio e ausente', () => {
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeReturnUrl('/painel')).toBeNull();
    expect(sanitizeReturnUrl('')).toBeNull();
    expect(sanitizeReturnUrl(undefined)).toBeNull();
  });
});

describe('isOriginAllowed', () => {
  const permitidas = ['https://app.exemplo.com', 'http://localhost:5173'];

  it('compara só a origem', () => {
    expect(isOriginAllowed('https://app.exemplo.com/qualquer/caminho', permitidas)).toBe(true);
    expect(isOriginAllowed('https://app.exemplo.com.atacante.com/', permitidas)).toBe(false);
    expect(isOriginAllowed('http://app.exemplo.com/', permitidas)).toBe(false);
  });

  it('lista vazia ou URL inválida recusa', () => {
    expect(isOriginAllowed('https://app.exemplo.com')).toBe(false);
    expect(isOriginAllowed('não é url', permitidas)).toBe(false);
  });
});
