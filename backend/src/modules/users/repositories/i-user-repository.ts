import { User } from '../entities/user.entity';

/**
 * Query options para listagem com paginação e busca
 */
export interface FindAllQuery {
  skip?: number;
  take?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDesc?: boolean;
  search?: string;
}

/**
 * Options para buscar um registro
 */
export interface FindOneOptions {
  select?: (keyof User)[];
}

/**
 * Contrato do repositório de usuários
 * Implementação deve ser agnóstica a banco de dados
 */
export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findAll(query?: FindAllQuery): Promise<User[]>;
  count(query?: Pick<FindAllQuery, 'search'>): Promise<number>;
  findById(id: string, options?: FindOneOptions): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
