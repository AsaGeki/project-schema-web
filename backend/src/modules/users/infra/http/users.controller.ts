import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreateService } from '../../services/create.service';
import { DeleteService } from '../../services/delete.service';
import { FindAllService } from '../../services/find-all.service';
import { FindOneService } from '../../services/find-one.service';
import { UpdateService } from '../../services/update.service';

/**
 * Controller de usuários
 * Implementa operações CRUD com injeção de dependência
 * Padrão referência: universal/PADRAO-CRUD.md
 */
export default class UsersController {
  public async findAll(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindAllService);

    const query = {
      skip: req.query.skip ? Number(req.query.skip) : undefined,
      take: req.query.take ? Number(req.query.take) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortDesc: req.query.sortDesc === 'true',
      search: req.query.search as string | undefined,
    };

    const result = await service.execute(query);
    return res.json(result);
  }

  public async findOne(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindOneService);
    const result = await service.execute(req.params.id);
    return res.json(result);
  }

  public async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(UpdateService);
    const result = await service.execute(req.params.id, req.body);
    return res.json(result);
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    await service.execute(req.params.id);
    return res.status(204).send();
  }
}
