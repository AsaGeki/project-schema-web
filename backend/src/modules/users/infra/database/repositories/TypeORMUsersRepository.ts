import { appDataSource } from '@infra/database/DataSource';
import {
  FindAllQuery,
  IUsersRepository,
} from '@modules/users/repositories/IUsersRepository';
import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '../schemas/User';

@injectable()
export class TypeORMUsersRepository implements IUsersRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = appDataSource!.getRepository(User);
  }

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async findAll(query?: FindAllQuery): Promise<User[]> {
    const qb = this.repository.createQueryBuilder('user');

    if (query?.search) {
      qb.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query?.sortBy) {
      qb.orderBy(`user.${query.sortBy}`, query.sortDesc ? 'DESC' : 'ASC');
    }

    if (query?.skip) qb.skip(query.skip);
    if (query?.take) qb.take(query.take);

    return qb.getMany();
  }

  async count(query?: Pick<FindAllQuery, 'search'>): Promise<number> {
    const qb = this.repository.createQueryBuilder('user');

    if (query?.search) {
      qb.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    return qb.getCount();
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async update(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
