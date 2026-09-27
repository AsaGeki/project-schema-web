import sessionConfig from '@configs/sessionConfig';
import { isOriginAllowed, sanitizeReturnUrl } from '@shared/utils/url/urlSafety';

/**
 * Ponto único que decide se uma URL de retorno é confiável: sanitiza o valor
 * recebido e o devolve só quando a origem está em `ALLOWED_RETURN_ORIGINS`.
 */
export function origemConfiavel(returnTo: unknown): string | undefined {
  const url = typeof returnTo === 'string' ? sanitizeReturnUrl(returnTo) : null;

  if (!url || !isOriginAllowed(url, sessionConfig.allowedReturnOrigins)) return undefined;

  return url;
}
