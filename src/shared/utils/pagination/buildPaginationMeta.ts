import type { IPaginationMeta } from '@shared/types/response';

/** Campos de paginação a partir da página pedida e do total encontrado. Coleção vazia dá `totalPages` 0. */
export function buildPaginationMeta(page: number, limit: number, total: number): IPaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return { page, limit, total, totalPages, hasNext: page < totalPages };
}
