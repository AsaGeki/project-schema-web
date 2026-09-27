import { inject, injectable } from 'tsyringe';

import type { IUserPartial, IUserPublic } from '@modules/users/dtos/UserDTO';
import { EPermissaoUsers } from '@modules/users/EPermissaoUsers';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ConflictError, ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import type HashService from '@shared/services/HashService';
import { logger } from '@shared/services/LoggerService';
import type { IUsuarioAutenticado } from '@shared/types/auth';
import type { IResponseEx } from '@shared/types/response';
import { hasRequiredPermissions } from '@shared/utils/auth/hasRequiredPermissions';

const log = logger.child({ prefix: 'users' });

@injectable()
export default class UpdateService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
    @inject('HashService')
    private readonly hashService: HashService,
  ) {}

  public async execute(id: string, data: IUserPartial, autor: IUsuarioAutenticado): Promise<IResponseEx<IUserPublic>> {
    // Editar o próprio cadastro dispensa permissão; editar outro exige users:update.
    if (id !== autor.id && !hasRequiredPermissions(autor.abilities, [EPermissaoUsers.UPDATE])) {
      throw new ForbiddenError({ message: 'Você não tem permissão para editar outro usuário.' });
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
      updatedBy: autor.id,
    });

    if (!updated) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    log.info(`Usuário ${updated.email} atualizado por ${autor.id}.`);

    return { success: true, status: 200, message: 'Usuário atualizado com sucesso!', data: updated };
  }
}
