/**
 * Exports do módulo Users
 * Importar do módulo na ordem correta
 */

// Entidades
export { User } from './entities/user.entity';

// Repositories
export { InMemoryUserRepository } from './infra/database/in-memory-user.repository';
export {
  IUserRepository,
  type FindAllQuery,
  type FindOneOptions,
} from './repositories/i-user-repository';

// DTOs
export { CreateUserSchema, type CreateUserDTO } from './dtos/create-user.dto';
export { UpdateUserSchema, type UpdateUserDTO } from './dtos/update-user.dto';
export { type UserResponseDTO } from './dtos/user-response.dto';

// Services
export { CreateService } from './services/create.service';
export { DeleteService } from './services/delete.service';
export { FindAllService } from './services/find-all.service';
export { FindOneService } from './services/find-one.service';
export { UpdateService } from './services/update.service';

// Controller e Rotas
export { default as UsersController } from './infra/http/users.controller';
export { usersRouter } from './infra/http/users.routes';
