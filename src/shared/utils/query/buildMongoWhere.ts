import type { IFilterConfig } from '@shared/types/filter';
import type { IListQuery } from '@shared/types/pagination';
import { coerceRange } from '@shared/utils/query/coerceRange';
import { coerceScalar } from '@shared/utils/query/coerceScalar';
import { escapeRegex } from '@shared/utils/query/escapeRegex';

/**
 * Traduz a query coada + a `filterConfig` do repositório para o filtro do Mongo.
 * Mesma `filterConfig` do lado Prisma — muda só a gramática do operador:
 * `$regex` no lugar de `contains`, `$or` no lugar de `OR`, `$gte`/`$lte` no
 * lugar de `gte`/`lte`.
 */
export function buildMongoWhere<TFilter>(query: IListQuery, config: IFilterConfig): TFilter {
  const filter: Record<string, unknown> = {};

  for (const entry of config.equals ?? []) {
    const field = typeof entry === 'string' ? entry : entry.field;
    const value = typeof entry === 'string' ? query[field] : coerceScalar(query[field], entry.as);

    if (value !== undefined) filter[field] = value;
  }

  const term = typeof query.search === 'string' ? query.search.trim() : '';
  if (term && config.search) {
    const numeric = Number(term);
    const searchByNumber = config.search.number?.length && term !== '' && Number.isFinite(numeric);

    filter.$or = searchByNumber
      ? config.search.number!.map(field => ({ [field]: numeric }))
      : // O termo vem do cliente: escapado, para `.` ou `(` não virarem
        // metacaractere de regex nem quebrarem a query.
        config.search.text.map(field => ({ [field]: { $regex: escapeRegex(term), $options: 'i' } }));
  }

  for (const [field, spec] of Object.entries(config.range ?? {})) {
    const gte = spec.gte !== undefined ? coerceRange(query[spec.gte], spec.as) : undefined;
    const lte = spec.lte !== undefined ? coerceRange(query[spec.lte], spec.as) : undefined;

    if (gte !== undefined || lte !== undefined) {
      filter[field] = { ...(gte !== undefined ? { $gte: gte } : {}), ...(lte !== undefined ? { $lte: lte } : {}) };
    }
  }

  return filter as TFilter;
}
