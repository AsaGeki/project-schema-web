import { inject, injectable } from 'tsyringe';

import type { IUserPublic } from '@modules/users/dtos/UserDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import type { IListQuery } from '@shared/types/pagination';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class FindAllService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
  ) {}

  public async execute(query: IListQuery): Promise<IResponseEx<IUserPublic[]>> {
    const { items, ...paginacao } = await this.repository.list(query);

    return { success: true, status: 200, data: items, ...paginacao };
  }
}
