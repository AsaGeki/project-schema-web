import { z } from 'zod';

import type { IPaginationMeta } from '@shared/types/response';

export interface IPaginationParams {
  page: number;
  limit: number;
}

/** Página de resultados de um repositório: itens + metadados de paginação. */
export interface IPaginated<T> {
  items: T[];
  meta: IPaginationMeta;
}

/**
 * Query string genérica de paginação, com coerção de número e defaults. Schema de
 * infraestrutura transversal — um módulo estende com os próprios filtros em vez
 * de redeclarar `page`/`limit`.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TPaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Coador genérico de query de listagem: paginação + `search`, e o `catchall`
 * deixa os filtros específicos do módulo passarem como valor cru. Quem decide o
 * que vira filtro é a `filterConfig` declarada pelo repositório.
 */
export const listQuerySchema = paginationQuerySchema
  .extend({ search: z.string().trim().min(1).optional() })
  .catchall(z.unknown());

export interface IListQuery extends z.infer<typeof listQuerySchema> {}
