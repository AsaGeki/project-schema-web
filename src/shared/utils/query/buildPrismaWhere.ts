import type { IFilterConfig } from '@shared/types/filter';
import type { IListQuery } from '@shared/types/pagination';
import { coerceRange } from '@shared/utils/query/coerceRange';
import { coerceScalar } from '@shared/utils/query/coerceScalar';

/**
 * Traduz a query coada + a `filterConfig` do repositório para o `where` do
 * Prisma. Valor de range inválido é ignorado; enum inválido passa cru e o Prisma
 * barra, virando 400 no middleware de erro.
 */
export function buildPrismaWhere<TWhere>(query: IListQuery, config: IFilterConfig): TWhere {
  const where: Record<string, unknown> = {};

  for (const entry of config.equals ?? []) {
    const field = typeof entry === 'string' ? entry : entry.field;
    const value = typeof entry === 'string' ? query[field] : coerceScalar(query[field], entry.as);

    if (value !== undefined) where[field] = value;
  }

  const term = typeof query.search === 'string' ? query.search.trim() : '';
  if (term && config.search) {
    const numeric = Number(term);
    const searchByNumber = config.search.number?.length && term !== '' && Number.isFinite(numeric);

    where.OR = searchByNumber
      ? config.search.number!.map(field => ({ [field]: numeric }))
      : config.search.text.map(field => ({ [field]: { contains: term, mode: 'insensitive' } }));
  }

  for (const [field, spec] of Object.entries(config.range ?? {})) {
    const gte = spec.gte !== undefined ? coerceRange(query[spec.gte], spec.as) : undefined;
    const lte = spec.lte !== undefined ? coerceRange(query[spec.lte], spec.as) : undefined;

    if (gte !== undefined || lte !== undefined) {
      where[field] = { ...(gte !== undefined ? { gte } : {}), ...(lte !== undefined ? { lte } : {}) };
    }
  }

  return where as TWhere;
}
