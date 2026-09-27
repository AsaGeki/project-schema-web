import type { IArquivoDocument, IArquivoDTO } from '@modules/arquivos/dtos/ArquivoDTO';
import { Arquivo } from '@modules/arquivos/infra/mongo/models/Arquivo';
import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import BaseMongoRepository from '@shared/infra/database/mongo/BaseMongoRepository';

import type { Model } from 'mongoose';

export default class ArquivosRepository
  extends BaseMongoRepository<IArquivoDocument, IArquivoDTO>
  implements IArquivosRepository
{
  protected readonly model: Model<IArquivoDocument> = Arquivo;
}
