import { inject, injectable } from 'tsyringe';

import type { IPerfilPublico } from '@modules/permissoes/dtos/PerfilDTO';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import type { IListQuery } from '@shared/types/pagination';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class FindAllService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
  ) {}

  public async execute(query: IListQuery): Promise<IResponseEx<IPerfilPublico[]>> {
    const { items, ...paginacao } = await this.repository.list(query);

    return { success: true, status: 200, data: items, ...paginacao };
  }
}
