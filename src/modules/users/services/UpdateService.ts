import { inject, injectable } from 'tsyringe';

import type { IUserPartial, IUserPublic } from '@modules/users/dtos/UserDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ConflictError, ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import type HashService from '@shared/services/HashService';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'users' });

@injectable()
export default class UpdateService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
    @inject('HashService')
    private readonly hashService: HashService,
  ) {}

  public async execute(id: string, data: IUserPartial, authorId: string): Promise<IResponseEx<IUserPublic>> {
    const isSelf = id === authorId;
    const author = await this.repository.findById(authorId);

    if (!isSelf && !author?.isAdmin) {
      throw new ForbiddenError({ message: 'Você não tem permissão para editar outro usuário.' });
    }

    // Promover a admin é privilégio de admin, mesmo no próprio cadastro.
    if (data.isAdmin !== undefined && !author?.isAdmin) {
      throw new ForbiddenError({ message: 'Você não tem permissão para alterar o perfil de administrador.' });
    }

    if (data.email) {
      const owner = await this.repository.findByEmail(data.email);

      if (owner && owner.id !== id) {
        throw new ConflictError({ message: 'Já existe um usuário cadastrado com esse email.' });
      }
    }

    const password = data.password ? await this.hashService.hash(data.password) : undefined;

    const updated = await this.repository.update(id, {
      ...data,
      ...(password ? { password } : {}),
      updatedBy: authorId,
    });

    if (!updated) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    log.info(`Usuário ${updated.email} atualizado por ${authorId}.`);

    return { success: true, status: 200, message: 'Usuário atualizado com sucesso!', data: updated };
  }
}
