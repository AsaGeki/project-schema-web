import {
  CreateService,
  DeleteService,
  FindAllService,
  FindOneService,
  UpdateService,
} from '@modules/users/services';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export class UsersController {
  async findAll(req: Request, res: Response): Promise<Response> {
    const { skip, take, search, sortBy, sortDesc } = req.query;

    const service = container.resolve(FindAllService);
    const result = await service.execute({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      sortDesc: sortDesc === 'true',
    });

    return res.json(result);
  }

  async findOne(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindOneService);
    const user = await service.execute(req.params.id);
    return res.json(user);
  }

  async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const user = await service.execute(req.body);
    return res.status(201).json(user);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(UpdateService);
    const user = await service.execute(req.params.id, req.body);
    return res.json(user);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    await service.execute(req.params.id);
    return res.status(204).send();
  }
}
