import { CATALOGO_PERMISSOES } from '@modules/permissoes/catalogoPermissoes';
import { sendResponse } from '@shared/infra/https/sendResponse';

import type { Request, Response } from 'express';

export default class PermissoesController {
  /** O catálogo vem do código, não do banco: é a fonte que o seed sincroniza. */
  public catalogo(this: void, _req: Request, res: Response): Response {
    return sendResponse(res, { success: true, status: 200, data: CATALOGO_PERMISSOES });
  }
}
