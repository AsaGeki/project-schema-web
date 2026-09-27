import { container } from 'tsyringe';

import BaixarService from '@modules/arquivos/services/BaixarService';
import CreateService from '@modules/arquivos/services/CreateService';
import DeleteService from '@modules/arquivos/services/DeleteService';
import { NotFoundError } from '@shared/errors/UniversalError';
import { sendResponse } from '@shared/infra/https/sendResponse';

import type { NextFunction, Request, Response } from 'express';

/** O download responde com o arquivo, não com o envelope do `sendResponse`. */
export default class ArquivosController {
  public async create(this: void, req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.files as Express.Multer.File[] | undefined, req.user.id);
    return sendResponse(res, result);
  }

  public async baixar(this: void, req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    const service = container.resolve(BaixarService);
    const { caminho, nome } = await service.execute(req.params.id);

    res.download(caminho, nome, erro => {
      // O registro existe, mas o arquivo não está mais no storage.
      if (erro && !res.headersSent) next(new NotFoundError({ message: 'Arquivo não encontrado no armazenamento.' }));
    });
  }

  public async delete(this: void, req: Request<{ id: string }>, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    const result = await service.execute(req.params.id, req.user.id);
    return sendResponse(res, result);
  }
}
