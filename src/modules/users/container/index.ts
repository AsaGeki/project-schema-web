import { container } from 'tsyringe';

import UsersRepository from '@modules/users/infra/prisma/repositories/UsersRepository';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';

container.registerSingleton<IUsersRepository>('UsersRepository', UsersRepository);
