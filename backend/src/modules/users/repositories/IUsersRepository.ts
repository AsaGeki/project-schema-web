import { User } from '@modules/users/infra/database/schemas/User';

export interface FindAllQuery {
  skip?: number;
  take?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface IUsersRepository {
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findAll(query?: FindAllQuery): Promise<User[]>;
  count(query?: Pick<FindAllQuery, 'search'>): Promise<number>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
