import { inject, injectable } from 'tsyringe';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import { NotFoundError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'arquivos' });

@injectable()
export default class DeleteService {
  constructor(
    @inject('ArquivosRepository')
    private readonly repository: IArquivosRepository,
    @inject('FileStorage')
    private readonly storage: IFileStorage,
  ) {}

  public async execute(id: string, autorId: string): Promise<IResponseEx<never>> {
    const removido = await this.repository.delete(id);

    if (!removido) {
      throw new NotFoundError({ message: 'Arquivo não encontrado.' });
    }

    // O registro sai antes do arquivo: se o disco falhar, sobra arquivo sem registro, nunca registro sem arquivo.
    await this.storage.remove(removido.arquivo);

    log.info(`Arquivo ${removido.nomeOriginal} removido por ${autorId}.`);

    return { success: true, status: 204 };
  }
}
