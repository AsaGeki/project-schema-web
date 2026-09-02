import { inject, injectable } from 'tsyringe';

import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'users' });

@injectable()
export default class DeleteService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
  ) {}

  public async execute(id: string, authorId: string): Promise<IResponseEx<never>> {
    const author = await this.repository.findById(authorId);

    if (id !== authorId && !author?.isAdmin) {
      throw new ForbiddenError({ message: 'Você não tem permissão para remover outro usuário.' });
    }

    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    log.notice(`Usuário ${deleted.email} removido por ${authorId}.`);

    return { success: true, status: 204 };
  }
}
