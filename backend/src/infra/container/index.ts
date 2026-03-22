import 'reflect-metadata';
import { container } from 'tsyringe';

// Registre aqui os bindings de repositórios e demais injeções compartilhadas
// Exemplo:
// import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
// import { TypeORMUsersRepository } from '@modules/users/infra/database/repositories/TypeORMUsersRepository';
// container.registerSingleton<IUsersRepository>('UsersRepository', TypeORMUsersRepository);

// Os módulos podem exportar sua própria função de registro, ex:
// import '@modules/users/container';

export { container };
