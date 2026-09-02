/**
 * Whitelist declarada do que é filtrável numa listagem. Só o que está aqui vira
 * filtro — nunca "filtra por qualquer campo que o cliente mandar". O repositório
 * concreto declara sua `filterConfig` e a base traduz para o banco alvo.
 */

/**
 * Campo de igualdade: só o nome (valor cru) ou `{ field, as }` quando precisa
 * coagir. Valor que não coage é ignorado.
 */
export type TEqualsField = string | { field: string; as: 'boolean' | 'number' };

/**
 * Busca textual da listagem. `text` recebe busca por substring case-insensitive;
 * `number` só é consultado quando o termo é numérico, e nesse caso substitui a
 * busca textual.
 */
export interface ISearchConfig {
  text: readonly string[];
  number?: readonly string[];
}

/** `range` mapeia um campo do model para as chaves de query do `gte`/`lte`. */
export interface IRangeSpec {
  gte?: string;
  lte?: string;
  as?: 'date' | 'number';
}

export interface IFilterConfig {
  equals?: readonly TEqualsField[];
  search?: ISearchConfig;
  range?: Readonly<Record<string, IRangeSpec>>;
}
