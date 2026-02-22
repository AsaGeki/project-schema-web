// Configure o container de injeção de dependência aqui
import 'reflect-metadata';
import { container } from 'tsyringe';

// Módulo Users
import { InMemoryUserRepository, IUserRepository } from '@modules/users';

// Registrar repositórios
container.registerSingleton<IUserRepository>(
  'UserRepository',
  InMemoryUserRepository
);

export { container };
