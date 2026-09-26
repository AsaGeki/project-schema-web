import { env } from '@configs/envConfig';

/**
 * Chaves de integração server-to-server, lidas de `API_KEYS_HMAC` no formato
 * `id:segredo,id2:segredo2`. Entrada malformada é descartada em silêncio — uma
 * chave incompleta não deve virar credencial parcial válida.
 */
function parseKeys(raw: string): Record<string, string> {
  const entries = raw
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => entry.split(':'))
    .filter((parts): parts is [string, string] => parts.length === 2 && Boolean(parts[0]) && Boolean(parts[1]));

  return Object.fromEntries(entries.map(([id, secret]) => [id.trim(), secret.trim()]));
}

export const apiKeysConfig = {
  keys: parseKeys(env.apiKeys.API_KEYS_HMAC),
  toleranceMs: env.apiKeys.TOLERANCIA_MS,
};
