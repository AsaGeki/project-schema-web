import { inject, injectable } from 'tsyringe';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/UniversalError';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class AtribuirPerfisService {
  constructor(
    @inject('PerfisRepository')
    private readonly perfisRepository: IPerfisRepository,
  ) {}

  public async execute(userId: string, perfilIds: string[]): Promise<IResponseEx<never>> {
    const unicos = [...new Set(perfilIds)];

    if ((await this.perfisRepository.contarExistentes(unicos)) !== unicos.length) {
      throw new UnprocessableEntityError({
        message: 'Um ou mais perfis informados não existem.',
        code: 'PERFIL_INEXISTENTE',
      });
    }

    const atual = await this.perfisRepository.permissoesDoUsuario(userId);

    if (!atual) {
      throw new NotFoundError({ message: 'Usuário não encontrado.' });
    }

    const perdeAcessoTotal = atual.todasPermissoes && !(await this.perfisRepository.algumComAcessoTotal(unicos));

    if (perdeAcessoTotal && (await this.perfisRepository.contarUsuariosComAcessoTotal(userId)) === 0) {
      throw new ConflictError({
        message: 'Este é o último usuário com acesso total. Dê acesso total a outro usuário antes de tirá-lo deste.',
      });
    }

    await this.perfisRepository.definirPerfisDoUsuario(userId, unicos);

    return { success: true, status: 204 };
  }
}
