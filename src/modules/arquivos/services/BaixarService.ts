import { inject, injectable } from 'tsyringe';

import type { IArquivoParaDownload } from '@modules/arquivos/dtos/ArquivoDTO';
import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import { NotFoundError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';

/** O download responde com o arquivo: o service devolve o valor puro, sem envelope. */
@injectable()
export default class BaixarService {
  constructor(
    @inject('ArquivosRepository')
    private readonly repository: IArquivosRepository,
    @inject('FileStorage')
    private readonly storage: IFileStorage,
  ) {}

  public async execute(id: string): Promise<IArquivoParaDownload> {
    const arquivo = await this.repository.findById(id);

    if (!arquivo) {
      throw new NotFoundError({ message: 'Arquivo não encontrado.' });
    }

    return { caminho: this.storage.path(arquivo.arquivo), nome: arquivo.nomeOriginal };
  }
}
