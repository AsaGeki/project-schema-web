import { inject, injectable } from 'tsyringe';

import type { ILog, ILogDocument } from '@modules/logs/dtos/LogDTO';
import type ILogsRepository from '@modules/logs/repositories/ILogsRepository';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class CreateService {
  constructor(
    @inject('LogsRepository')
    private readonly repository: ILogsRepository,
  ) {}

  public async execute(data: ILog, authorId?: string): Promise<IResponseEx<ILogDocument>> {
    const created = await this.repository.create({ ...data, createdBy: authorId ?? null });

    return { success: true, status: 201, message: 'Log registrado com sucesso!', data: created };
  }
}
