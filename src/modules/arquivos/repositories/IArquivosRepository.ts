import type { IArquivoDocument, IArquivoDTO } from '@modules/arquivos/dtos/ArquivoDTO';
import type { IMongoRepository } from '@shared/infra/database/IBaseRepository';

/**
 * Depende de `IMongoRepository` porque o envio grava o lote com `insertMany` e o
 * desfaz com `deleteMany` quando um arquivo falha. O módulo é declaradamente Mongo.
 */
export default interface IArquivosRepository extends IMongoRepository<IArquivoDocument, IArquivoDTO> {}
