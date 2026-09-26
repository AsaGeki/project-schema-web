/**
 * Contrato de sucesso na fronteira HTTP.
 *
 * Service chamado direto por um controller retorna nesse formato em vez do dado
 * puro, para o controller repassar a resposta sem `if` de formatação. Falha é
 * sinalizada lançando `UniversalError`, nunca com `success: false`.
 */
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

/** Campos de paginação ficam na raiz do envelope, ao lado de `data`, não aninhados. */
export interface IResponseEx<T = unknown> extends Partial<IPaginationMeta> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  /** Headers extras a setar na resposta — o `sendResponse` aplica. */
  headers?: Record<string, string>;
}
