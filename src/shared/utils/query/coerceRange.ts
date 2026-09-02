/**
 * Coage um valor de range da query. `date` aceita string ISO ou unix (só
 * dígitos; abaixo de 1e12 é tratado como segundos, senão milissegundos);
 * `number` aceita string numérica. Inválido vira `undefined` e o filtro é
 * ignorado.
 */
export function coerceRange(value: unknown, as: 'date' | 'number' = 'date'): Date | number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const raw = value.trim();

  if (as === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (/^\d+$/.test(raw)) {
    const parsed = Number(raw);
    const milliseconds = parsed < 1e12 ? parsed * 1000 : parsed;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
