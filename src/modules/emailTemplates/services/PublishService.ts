import { inject, injectable } from 'tsyringe';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import type { IEmailTemplateDocument, IEmailTemplatePublicacao } from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import { NotFoundError, UnprocessableEntityError } from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'email-templates' });

/** Acima disso o servidor de e-mail recusa, ou o e-mail vira transferência de arquivo. */
const MAXIMO_BYTES_ANEXOS = 10 * 1024 * 1024;

@injectable()
export default class PublishService {
  constructor(
    @inject('EmailTemplatesRepository')
    private readonly repository: IEmailTemplatesRepository,
    @inject('ArquivosRepository')
    private readonly arquivosRepository: IArquivosRepository,
  ) {}

  public async execute(
    flag: string,
    conteudo: IEmailTemplatePublicacao,
    autorId: string,
  ): Promise<IResponseEx<IEmailTemplateDocument>> {
    if (!Object.values(EFlagEmail).includes(flag as EFlagEmail)) {
      throw new NotFoundError({ message: 'Flag de e-mail inexistente.' });
    }

    const anexos = await this.buscarArquivos(conteudo.anexos);
    const imagens = await this.buscarArquivos(conteudo.imagensInline);

    const totalBytes = anexos.reduce((soma, arquivo) => soma + arquivo.tamanhoBytes, 0);
    if (totalBytes > MAXIMO_BYTES_ANEXOS) {
      throw new UnprocessableEntityError({
        message: `Os anexos somam ${(totalBytes / 1024 / 1024).toFixed(1)} MB; o limite é 10 MB por template.`,
        code: 'ANEXOS_ACIMA_DO_LIMITE',
      });
    }

    if (imagens.some(arquivo => !arquivo.mimeType.startsWith('image/'))) {
      throw new UnprocessableEntityError({
        message: 'Imagem inline precisa ser um arquivo de imagem.',
        code: 'IMAGEM_INLINE_INVALIDA',
      });
    }

    const template = await this.repository.upsertByFlag(flag as EFlagEmail, conteudo, autorId);

    log.info(`Template de e-mail '${flag}' publicado por ${autorId}.`);

    return { success: true, status: 200, message: 'Template publicado com sucesso!', data: template };
  }

  /** Repetido para anexos e imagens: todo id tem que existir no módulo `arquivos`. */
  private async buscarArquivos(ids: string[]): Promise<{ tamanhoBytes: number; mimeType: string }[]> {
    const arquivos = await Promise.all(ids.map(id => this.arquivosRepository.findById(id)));

    if (arquivos.some(arquivo => arquivo === null)) {
      throw new UnprocessableEntityError({
        message: 'Um ou mais arquivos do template não existem.',
        code: 'ANEXO_INEXISTENTE',
      });
    }

    return arquivos as { tamanhoBytes: number; mimeType: string }[];
  }
}
