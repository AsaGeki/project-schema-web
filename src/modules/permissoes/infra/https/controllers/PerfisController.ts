import { container } from 'tsyringe';

import type { IPerfil, IPerfilPartial } from '@modules/permissoes/dtos/PerfilDTO';
import CreateService from '@modules/permissoes/services/perfis/CreateService';
import DeleteService from '@modules/permissoes/services/perfis/DeleteService';
import FindAllService from '@modules/permissoes/services/perfis/FindAllService';
import FindByIdService from '@modules/permissoes/services/perfis/FindByIdService';
import UpdateService from '@modules/permissoes/services/perfis/UpdateService';
import { sendResponse } from '@shared/infra/https/sendResponse';
import type { IListQuery } from '@shared/types/pagination';

import type { Request, Response } from 'express';

export default class PerfisController {
  public async create(this: void, req: Request<unknown, unknown, IPerfil>, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body, req.user.id);
    return sendResponse(res, result);
  }

  public async findAll(this: void, _req: Request, res: Response<unknown, { query: IListQuery }>): Promise<Response> {
    const service = container.resolve(FindAllService);
    const result = await service.execute(res.locals.query);
    return sendResponse(res, result);
  }

  public async findById(this: void, req: Request<{ id: string }>, res: Response): Promise<Response> {
    const service = container.resolve(FindByIdService);
    const result = await service.execute(req.params.id);
    return sendResponse(res, result);
  }

  public async update(
    this: void,
    req: Request<{ id: string }, unknown, IPerfilPartial>,
    res: Response,
  ): Promise<Response> {
    const service = container.resolve(UpdateService);
    const result = await service.execute(req.params.id, req.body, req.user.id);
    return sendResponse(res, result);
  }

  public async delete(this: void, req: Request<{ id: string }>, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    const result = await service.execute(req.params.id);
    return sendResponse(res, result);
  }
}
