import { container } from 'tsyringe';

import type { ILog } from '@modules/logs/dtos/LogDTO';
import CreateService from '@modules/logs/services/CreateService';
import FindAllService from '@modules/logs/services/FindAllService';
import { sendResponse } from '@shared/infra/https/sendResponse';
import type { IListQuery } from '@shared/types/pagination';

import type { Request, Response } from 'express';

export default class LogsController {
  public async create(this: void, req: Request<unknown, unknown, ILog>, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body, req.user.id);
    return sendResponse(res, result);
  }

  public async findAll(
    this: void,
    req: Request,
    res: Response<unknown, { query: IListQuery }>,
  ): Promise<Response> {
    const service = container.resolve(FindAllService);
    const result = await service.execute(req.user, res.locals.query);
    return sendResponse(res, result);
  }
}
