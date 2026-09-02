import type { IUserCreate, IUserPublic, IUserUpdate } from '@modules/users/dtos/UserDTO';
import type { IBaseRepository } from '@shared/infra/database/IBaseRepository';

import type { User } from '@prisma/client';

export default interface IUsersRepository extends IBaseRepository<IUserPublic, IUserCreate, IUserUpdate> {
  findByEmail(email: string): Promise<IUserPublic | null>;
  /** Retorna o usuário com a senha — usar apenas na autenticação. */
  findByEmailWithPassword(email: string): Promise<User | null>;
}
