import { inject, injectable } from 'tsyringe';

import type { IUserPublic } from '@modules/users/dtos/UserDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ForbiddenError } from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';
import type { IListQuery } from '@shared/types/pagination';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'users' });

interface IAuthenticatedUser {
  id: string;
  isAdmin: boolean;
}

@injectable()
export default class FindAllService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
  ) {}

  public async execute(authenticatedUser: IAuthenticatedUser, query: IListQuery): Promise<IResponseEx<IUserPublic[]>> {
    if (!authenticatedUser.isAdmin) {
      log.warn(`Usuário ${authenticatedUser.id} tentou listar usuários sem ser admin.`);
      throw new ForbiddenError({ message: 'Você não tem permissão para listar usuários.' });
    }

    const { items, meta } = await this.repository.list(query);

    return { success: true, status: 200, data: items, meta };
  }
}
