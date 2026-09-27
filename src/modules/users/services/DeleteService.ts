import { inject, injectable } from 'tsyringe';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import { EPermissaoUsers } from '@modules/users/EPermissaoUsers';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ConflictError, ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';
import type { IUsuarioAutenticado } from '@shared/types/auth';
import type { IResponseEx } from '@shared/types/response';
import { hasRequiredPermissions } from '@shared/utils/auth/hasRequiredPermissions';

const log = logger.child({ prefix: 'users' });

@injectable()
export default class DeleteService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
    @inject('PerfisRepository')
    private readonly perfisRepository: IPerfisRepository,
  ) {}

  public async execute(id: string, autor: IUsuarioAutenticado): Promise<IResponseEx<never>> {
    // Remover a si mesmo dispensa permissão; remover outro exige users:delete.
    if (id !== autor.id && !hasRequiredPermissions(autor.abilities, [EPermissaoUsers.DELETE])) {
      throw new ForbiddenError({ message: 'Você não tem permissão para remover outro usuário.' });
    }

    const alvo = await this.perfisRepository.permissoesDoUsuario(id);

    if (!alvo) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    if (alvo.todasPermissoes && (await this.perfisRepository.contarUsuariosComAcessoTotal(id)) === 0) {
      throw new ConflictError({
        message: 'Este é o último usuário com acesso total. Dê acesso total a outro usuário antes de removê-lo.',
      });
    }

    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    log.notice(`Usuário ${deleted.email} removido por ${autor.id}.`);

    return { success: true, status: 204 };
  }
}
