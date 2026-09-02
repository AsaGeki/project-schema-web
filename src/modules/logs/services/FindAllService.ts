import { inject, injectable } from 'tsyringe';


import type { ILogDocument } from '@modules/logs/dtos/LogDTO';
import type ILogsRepository from '@modules/logs/repositories/ILogsRepository';
import { ForbiddenError } from '@shared/errors/UniversalError';
import type { IListQuery } from '@shared/types/pagination';
import type { IResponseEx } from '@shared/types/response';

interface IAuthenticatedUser {
  id: string;
  isAdmin: boolean;
}

@injectable()
export default class FindAllService {
  constructor(
    @inject('LogsRepository')
    private readonly repository: ILogsRepository,
  ) {}

  public async execute(
    authenticatedUser: IAuthenticatedUser,
    query: IListQuery,
  ): Promise<IResponseEx<ILogDocument[]>> {
    if (!authenticatedUser.isAdmin) {
      throw new ForbiddenError({ message: 'Você não tem permissão para consultar os logs.' });
    }

    const { items, meta } = await this.repository.list(query);

    return { success: true, status: 200, data: items, meta };
  }
}
