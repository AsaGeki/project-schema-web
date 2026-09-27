import { inject, injectable } from 'tsyringe';

import type { ILogDocument } from '@modules/logs/dtos/LogDTO';
import type ILogsRepository from '@modules/logs/repositories/ILogsRepository';
import type { IListQuery } from '@shared/types/pagination';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class FindAllService {
  constructor(
    @inject('LogsRepository')
    private readonly repository: ILogsRepository,
  ) {}

  public async execute(query: IListQuery): Promise<IResponseEx<ILogDocument[]>> {
    const { items, ...paginacao } = await this.repository.list(query);

    return { success: true, status: 200, data: items, ...paginacao };
  }
}
