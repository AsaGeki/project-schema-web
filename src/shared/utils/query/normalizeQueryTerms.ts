/**
 * Normaliza um parâmetro de lista da query string. Aceita tanto repetição do
 * parâmetro (`?tag=a&tag=b`, que o Express entrega como array) quanto lista
 * separada por vírgula (`?tag=a,b`), e devolve os termos limpos.
 */
export function normalizeQueryTerms(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [value];

  return raw
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .flatMap(item => String(item).split(','))
    .map(item => item.trim())
    .filter(Boolean);
}
