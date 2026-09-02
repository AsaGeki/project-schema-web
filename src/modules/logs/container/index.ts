import { container } from 'tsyringe';

import LogsRepository from '@modules/logs/infra/mongo/repositories/LogsRepository';
import type ILogsRepository from '@modules/logs/repositories/ILogsRepository';

container.registerSingleton<ILogsRepository>('LogsRepository', LogsRepository);
