import { TypeORMUsersRepository } from '@modules/users/infra/database/repositories/TypeORMUsersRepository';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import 'reflect-metadata';
import { container } from 'tsyringe';

container.registerSingleton<IUsersRepository>(
  'UsersRepository',
  TypeORMUsersRepository
);
