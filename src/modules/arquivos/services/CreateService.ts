import { inject, injectable } from 'tsyringe';

import type { IArquivoDocument, IArquivoDTO } from '@modules/arquivos/dtos/ArquivoDTO';
import { EXTENSOES_ACEITAS, EXTENSOES_IMAGEM } from '@modules/arquivos/formatosAceitos';
import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import {
  BadRequestError,
  ConflictError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';
import { descartarTemporarios } from '@shared/utils/files/descartarTemporarios';
import { detectarFormato } from '@shared/utils/files/detectarFormato';
import { lerAssinatura } from '@shared/utils/files/lerAssinatura';
import { otimizarImagem } from '@shared/utils/files/otimizarImagem';

const log = logger.child({ prefix: 'arquivos' });

@injectable()
export default class CreateService {
  constructor(
    @inject('ArquivosRepository')
    private readonly repository: IArquivosRepository,
    @inject('FileStorage')
    private readonly storage: IFileStorage,
  ) {}

  public async execute(
    arquivos: Express.Multer.File[] | undefined,
    autorId: string,
  ): Promise<IResponseEx<IArquivoDocument[]>> {
    const temporarios = (arquivos ?? []).map(arquivo => arquivo.path);
    const keys: string[] = [];

    try {
      if (!arquivos?.length) {
        throw new BadRequestError({ message: 'Nenhum arquivo enviado. Envie os arquivos no campo "arquivos".' });
      }

      const registros: IArquivoDTO[] = [];

      for (const arquivo of arquivos) {
        const formato = await detectarFormato(arquivo.path);

        if (!formato || !EXTENSOES_ACEITAS.includes(formato.ext)) {
          throw new UnsupportedMediaTypeError({
            message: `Formato não aceito: ${arquivo.originalname}.`,
            code: 'FORMATO_NAO_ACEITO',
          });
        }

        let caminho = arquivo.path;

        if (EXTENSOES_IMAGEM.includes(formato.ext)) {
          // A assinatura diz imagem, mas o conteúdo pode estar truncado ou corrompido.
          caminho = await otimizarImagem(arquivo.path, formato.ext).catch(() => {
            throw new UnprocessableEntityError({
              message: `Imagem inválida ou corrompida: ${arquivo.originalname}.`,
              code: 'IMAGEM_INVALIDA',
            });
          });
          temporarios.push(caminho);
        }

        const { hashSha256, tamanhoBytes } = await lerAssinatura(caminho);

        const repetido =
          registros.some(registro => registro.hashSha256 === hashSha256) ||
          (await this.repository.findOne({ createdBy: autorId, hashSha256 })) !== null;

        if (repetido) {
          throw new ConflictError({
            message: `Arquivo já enviado: ${arquivo.originalname}.`,
            code: 'ARQUIVO_REPETIDO',
          });
        }

        const key = await this.storage.save(caminho, 'arquivos', formato.ext);
        keys.push(key);

        registros.push({
          nomeOriginal: arquivo.originalname,
          arquivo: key,
          mimeType: formato.mime,
          tamanhoBytes,
          hashSha256,
          createdBy: autorId,
        });
      }

      const criados = await this.repository.insertMany(registros);

      log.info(`${criados.length} arquivo(s) enviado(s) por ${autorId}.`);

      return { success: true, status: 201, message: 'Arquivos enviados com sucesso!', data: criados };
    } catch (error) {
      // O insertMany grava os documentos anteriores ao que falhou: registro e arquivo do lote saem juntos.
      if (keys.length > 0) {
        await this.repository.deleteMany({ arquivo: { $in: keys } });
        await Promise.all(keys.map(key => this.storage.remove(key)));
      }

      throw error;
    } finally {
      await descartarTemporarios(temporarios);
    }
  }
}
