import { container } from 'tsyringe';

import '@modules/logs/container';
import '@modules/users/container';
import HashService from '@shared/services/HashService';

container.registerSingleton<HashService>('HashService', HashService);

export { container };
