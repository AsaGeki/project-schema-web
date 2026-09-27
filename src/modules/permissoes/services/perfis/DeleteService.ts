import { inject, injectable } from 'tsyringe';

import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import { ForbiddenError, NotFoundError } from '@shared/errors/UniversalError';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class DeleteService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
  ) {}

  public async execute(id: string): Promise<IResponseEx<never>> {
    const atual = await this.repository.findById(id);

    if (!atual) {
      throw new NotFoundError({ message: 'Perfil não encontrado.' });
    }

    if (atual.todasPermissoes) {
      throw new ForbiddenError({ message: 'O perfil de acesso total só sai pelo seed.' });
    }

    await this.repository.delete(id);

    return { success: true, status: 204 };
  }
}
