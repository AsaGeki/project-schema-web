import { inject, injectable } from 'tsyringe';

import type { IPerfilPublico } from '@modules/permissoes/dtos/PerfilDTO';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import { NotFoundError } from '@shared/errors/UniversalError';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class FindByIdService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
  ) {}

  public async execute(id: string): Promise<IResponseEx<IPerfilPublico>> {
    const perfil = await this.repository.findById(id);

    if (!perfil) {
      throw new NotFoundError({ message: 'Perfil não encontrado.' });
    }

    return { success: true, status: 200, data: perfil };
  }
}
