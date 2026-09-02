/**
 * Coage um valor de `equals` que não é string pura. `boolean` aceita só
 * `'true'`/`'false'`; `number` aceita string numérica. Inválido vira `undefined`
 * e o filtro é ignorado.
 */
export function coerceScalar(value: unknown, as: 'boolean' | 'number'): boolean | number | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();

  if (as === 'boolean') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return undefined;
  }

  const parsed = Number(raw);
  return raw !== '' && Number.isFinite(parsed) ? parsed : undefined;
}
