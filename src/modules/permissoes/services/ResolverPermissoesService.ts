import { inject, injectable } from 'tsyringe';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';

/** Service interno, chamado pelo `verifyToken` a cada requisição: devolve o valor puro, sem envelope. */
@injectable()
export default class ResolverPermissoesService implements IResolvedorDePermissoes {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
  ) {}

  public async execute(userId: string): Promise<string[] | null> {
    const resolvidas = await this.repository.permissoesDoUsuario(userId);
    if (!resolvidas) return null;

    return resolvidas.todasPermissoes ? ['*'] : resolvidas.permissoes;
  }
}
