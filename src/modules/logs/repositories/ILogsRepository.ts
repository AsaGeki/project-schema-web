import type { ILogCreate, ILogDocument } from '@modules/logs/dtos/LogDTO';
import type { IMongoRepository } from '@shared/infra/database/IBaseRepository';

/**
 * Depende de `IMongoRepository` — e não do contrato agnóstico — porque a
 * ingestão de log usa `insertMany` em lote. O módulo é declaradamente Mongo.
 */
export default interface ILogsRepository extends IMongoRepository<ILogDocument, ILogCreate> {
  findByTarget(targetId: string): Promise<ILogDocument[]>;
}
