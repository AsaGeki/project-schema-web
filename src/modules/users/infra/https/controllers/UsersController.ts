import { container } from 'tsyringe';

import type { IUser, IUserPartial } from '@modules/users/dtos/UserDTO';
import CreateService from '@modules/users/services/CreateService';
import DeleteService from '@modules/users/services/DeleteService';
import FindAllService from '@modules/users/services/FindAllService';
import UpdateService from '@modules/users/services/UpdateService';
import { sendResponse } from '@shared/infra/https/sendResponse';
import type { IListQuery } from '@shared/types/pagination';

import type { Request, Response } from 'express';

export default class UsersController {
  public async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body as IUser);
    return sendResponse(res, result);
  }

  public async findAll(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindAllService);
    const result = await service.execute(req.user, res.locals.query as IListQuery);
    return sendResponse(res, result);
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(UpdateService);
    const result = await service.execute(req.params.id as string, req.body as IUserPartial, req.user.id);
    return sendResponse(res, result);
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    const result = await service.execute(req.params.id as string, req.user.id);
    return sendResponse(res, result);
  }
}
