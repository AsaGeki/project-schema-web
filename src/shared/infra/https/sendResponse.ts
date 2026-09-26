import type { IResponseEx } from '@shared/types/response';

import type { Response } from 'express';

/**
 * Tradutor único de `IResponseEx` para resposta HTTP, usado por todos os
 * controllers. O service devolve o envelope uniforme; aqui num lugar só ele é
 * fragmentado nas camadas certas do HTTP:
 *
 * - `status` vai para a linha de status e `headers` para os headers, nenhum dos
 *   dois se repete no corpo;
 * - o corpo é o resto do envelope, com os campos de paginação na raiz.
 *
 * É o ponto de extensão para convenções que valem para toda a API — `Location`
 * no 201, cookie de refresh, corpo vazio no 204 — sem espalhar `res.*` pelos
 * controllers.
 */
export function sendResponse<T>(res: Response, result: IResponseEx<T>): Response {
  const { status, headers, ...body } = result;

  res.status(status);

  if (headers) {
    res.set(headers);
  }

  // 204 (No Content) e 304 (Not Modified) não podem ter corpo.
  if (status === 204 || status === 304) {
    return res.end();
  }

  return res.json(body);
}
