import type { IResponseEx } from '@shared/types/response';

import type { Response } from 'express';

/**
 * Tradutor único de `IResponseEx` para resposta HTTP, usado por todos os
 * controllers. O service devolve o envelope uniforme; aqui num lugar só ele é
 * fragmentado nas camadas certas do HTTP:
 *
 * - `status` vai para a linha de status, não é repetido no corpo;
 * - o corpo é `{ success, message, data, meta }`.
 *
 * É o ponto de extensão para convenções que valem para toda a API — `Location`
 * no 201, cookie de refresh, corpo vazio no 204 — sem espalhar `res.*` pelos
 * controllers.
 */
export function sendResponse<T>(res: Response, result: IResponseEx<T>): Response {
  res.status(result.status);

  if (result.headers) {
    res.set(result.headers);
  }

  // 204 (No Content) e 304 (Not Modified) não podem ter corpo.
  if (result.status === 204 || result.status === 304) {
    return res.end();
  }

  return res.json({ success: result.success, message: result.message, data: result.data, meta: result.meta });
}
