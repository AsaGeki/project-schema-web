/**
 * Converte um valor de query string em booleano. Só `'true'` e `'false'`
 * contam — qualquer outra coisa devolve `undefined`, para o filtro ser
 * ignorado em vez de virar `false` silenciosamente.
 */
export function parseBooleanQuery(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return undefined;
}
