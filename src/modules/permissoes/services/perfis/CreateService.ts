import { inject, injectable } from 'tsyringe';

import type { IPerfil, IPerfilPublico } from '@modules/permissoes/dtos/PerfilDTO';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import TraduzirPermissoesService from '@modules/permissoes/services/perfis/TraduzirPermissoesService';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class CreateService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
    @inject(TraduzirPermissoesService)
    private readonly traduzirPermissoes: TraduzirPermissoesService,
  ) {}

  public async execute(data: IPerfil, autorId: string): Promise<IResponseEx<IPerfilPublico>> {
    const permissaoIds = await this.traduzirPermissoes.execute(data.permissoes);

    const criado = await this.repository.create({
      nome: data.nome,
      descricao: data.descricao,
      permissaoIds,
      createdBy: autorId,
    });

    return { success: true, status: 201, message: 'Perfil criado com sucesso!', data: criado };
  }
}
