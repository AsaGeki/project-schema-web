import { injectable } from 'tsyringe';
import { User } from '../../entities/user.entity';
import {
  FindAllQuery,
  FindOneOptions,
  IUserRepository,
} from '../../repositories/i-user-repository';

/**
 * Implementação fake/in-memory do repositório de usuários
 * Para exemplo - substitua por TypeORM/Prisma em produção
 * Padrão referência: universal/PADRAO-CRUD.md
 */
@injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async findAll(query?: FindAllQuery): Promise<User[]> {
    let users = Array.from(this.users.values());

    // Aplicar busca
    if (query?.search) {
      const search = query.search.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    // Ordenação
    if (query?.sortBy) {
      const sortKey = query.sortBy as keyof User;
      users.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return query.sortDesc ? 1 : -1;
        if (aVal > bVal) return query.sortDesc ? -1 : 1;
        return 0;
      });
    }

    // Paginação
    const skip = query?.skip || query?.offset || 0;
    const take = query?.take || query?.limit || 10;
    users = users.slice(skip, skip + take);

    return users;
  }

  async count(query?: Pick<FindAllQuery, 'search'>): Promise<number> {
    let users = Array.from(this.users.values());

    if (query?.search) {
      const search = query.search.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    return users.length;
  }

  async findById(id: string, options?: FindOneOptions): Promise<User | null> {
    const user = this.users.get(id) || null;

    if (!user) return null;

    // Se especificou campos, retornar só esses
    if (options?.select) {
      const selected: Partial<User> = {};
      options.select.forEach(key => {
        (selected as Record<string, unknown>)[key] = user[key as keyof User];
      });
      return selected as User;
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async update(user: User): Promise<User> {
    if (!this.users.has(user.id)) {
      throw new Error('User not found');
    }

    user.updatedAt = new Date();
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
