/**
 * Valida e normaliza uma URL de retorno, só com protocolo http ou https. Sem
 * essa checagem, qualquer valor vira open redirect.
 */
export function sanitizeReturnUrl(returnUrl?: string | null): string | null {
  if (!returnUrl) return null;

  try {
    const url = new URL(returnUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** A origem de `url` está entre as permitidas; o caminho não importa. */
export function isOriginAllowed(url: string, allowedOrigins: string[] = []): boolean {
  try {
    const { origin } = new URL(url);

    return allowedOrigins.some(permitida => {
      try {
        return new URL(permitida).origin === origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
