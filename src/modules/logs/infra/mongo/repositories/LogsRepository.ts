import type { ILogCreate, ILogDocument } from '@modules/logs/dtos/LogDTO';
import { Log } from '@modules/logs/infra/mongo/models/Log';
import type ILogsRepository from '@modules/logs/repositories/ILogsRepository';
import BaseMongoRepository from '@shared/infra/database/mongo/BaseMongoRepository';
import type { IFilterConfig } from '@shared/types/filter';

import type { Model } from 'mongoose';

export default class LogsRepository
  extends BaseMongoRepository<ILogDocument, ILogCreate>
  implements ILogsRepository
{
  protected readonly model: Model<ILogDocument> = Log;

  protected override readonly filterConfig: IFilterConfig = {
    equals: ['action', 'category', 'targetId', 'createdBy'],
    search: { text: ['message', 'action'] },
    range: { createdAt: { gte: 'criadoDe', lte: 'criadoAte', as: 'date' } },
  };

  public async findByTarget(targetId: string): Promise<ILogDocument[]> {
    return this.model.find({ targetId }).sort(this.defaultSort).exec();
  }
}
