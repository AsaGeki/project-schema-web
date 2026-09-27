import { inject, injectable } from 'tsyringe';

import type { IPerfilPartial, IPerfilPublico } from '@modules/permissoes/dtos/PerfilDTO';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import TraduzirPermissoesService from '@modules/permissoes/services/perfis/TraduzirPermissoesService';
import { ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class UpdateService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
    @inject(TraduzirPermissoesService)
    private readonly traduzirPermissoes: TraduzirPermissoesService,
  ) {}

  public async execute(id: string, data: IPerfilPartial, autorId: string): Promise<IResponseEx<IPerfilPublico>> {
    const atual = await this.repository.findById(id);

    if (!atual) {
      throw new NotFoundError({ message: 'Perfil não encontrado.' });
    }

    if (atual.todasPermissoes) {
      throw new ForbiddenError({ message: 'O perfil de acesso total só muda pelo seed.' });
    }

    const permissaoIds = data.permissoes ? await this.traduzirPermissoes.execute(data.permissoes) : undefined;

    const atualizado = await this.repository.update(id, {
      nome: data.nome,
      descricao: data.descricao,
      updatedBy: autorId,
      ...(permissaoIds && { permissaoIds }),
    });

    if (!atualizado) {
      throw new NotFoundError({ message: 'Perfil não encontrado.' });
    }

    return { success: true, status: 200, message: 'Perfil atualizado com sucesso!', data: atualizado };
  }
}
