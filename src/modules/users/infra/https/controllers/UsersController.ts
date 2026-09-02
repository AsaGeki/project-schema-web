import { container } from 'tsyringe';

import type { IUser, IUserPartial } from '@modules/users/dtos/UserDTO';
import CreateService from '@modules/users/services/CreateService';
import DeleteService from '@modules/users/services/DeleteService';
import FindAllService from '@modules/users/services/FindAllService';
import UpdateService from '@modules/users/services/UpdateService';
import { sendResponse } from '@shared/infra/https/sendResponse';
import type { IListQuery } from '@shared/types/pagination';

import type { Request, Response } from 'express';

/**
 * `this: void` declara que nenhum método toca a instância, e é o que permite
 * registrá-los na rota sem `bind`. Método que passar a depender de estado perde
 * essa marca e volta a exigir o `bind` no `Route`.
 */
export default class UsersController {
  public async create(this: void, req: Request<unknown, unknown, IUser>, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return sendResponse(res, result);
  }

  public async findAll(this: void, req: Request, res: Response<unknown, { query: IListQuery }>): Promise<Response> {
    const service = container.resolve(FindAllService);
    const result = await service.execute(req.user, res.locals.query);
    return sendResponse(res, result);
  }

  public async update(
    this: void,
    req: Request<{ id: string }, unknown, IUserPartial>,
    res: Response,
  ): Promise<Response> {
    const service = container.resolve(UpdateService);
    const result = await service.execute(req.params.id, req.body, req.user.id);
    return sendResponse(res, result);
  }

  public async delete(this: void, req: Request<{ id: string }>, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    const result = await service.execute(req.params.id, req.user.id);
    return sendResponse(res, result);
  }
}
