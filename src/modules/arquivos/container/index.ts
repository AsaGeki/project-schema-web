import { container } from 'tsyringe';

import ArquivosRepository from '@modules/arquivos/infra/mongo/repositories/ArquivosRepository';
import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';

container.registerSingleton<IArquivosRepository>('ArquivosRepository', ArquivosRepository);
