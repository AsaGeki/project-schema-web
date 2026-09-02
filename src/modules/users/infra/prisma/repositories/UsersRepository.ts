import { prisma } from '@configs/database/prismaClient';
import type { IUserCreate, IUserPublic, IUserUpdate } from '@modules/users/dtos/UserDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import BasePrismaRepository from '@shared/infra/database/prisma/BasePrismaRepository';
import type { IFilterConfig } from '@shared/types/filter';

import type { User } from '@prisma/client';

/** Projeção pública — mantém a senha fora de toda query que não seja de login. */
const publicFields = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
} as const;

export default class UsersRepository
  extends BasePrismaRepository<IUserPublic, IUserCreate, IUserUpdate>
  implements IUsersRepository
{
  protected readonly delegate = prisma.user;

  protected override readonly filterConfig: IFilterConfig = {
    equals: [{ field: 'isAdmin', as: 'boolean' }],
    search: { text: ['name', 'email'] },
    range: { createdAt: { gte: 'criadoDe', lte: 'criadoAte', as: 'date' } },
  };

  public async findByEmail(email: string): Promise<IUserPublic | null> {
    return prisma.user.findUnique({ where: { email }, select: publicFields });
  }

  public async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
