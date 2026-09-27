import { container } from 'tsyringe';

import '@modules/arquivos/container';
import '@modules/logs/container';
import '@modules/permissoes/container';
import '@modules/users/container';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import LocalDiskStorage from '@shared/infra/storage/LocalDiskStorage';
import HashService from '@shared/services/HashService';

container.registerSingleton<HashService>('HashService', HashService);
container.registerSingleton<IFileStorage>('FileStorage', LocalDiskStorage);

export { container };
