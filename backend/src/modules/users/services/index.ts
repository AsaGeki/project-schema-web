import { ConflictError, NotFoundError } from '@core/errors/AppError';
import { CreateUserDTO } from '@modules/users/dtos/CreateUserDTO';
import { UpdateUserDTO } from '@modules/users/dtos/UpdateUserDTO';
import { UserResponseDTO } from '@modules/users/dtos/UserResponseDTO';
import {
  FindAllQuery,
  IUsersRepository,
} from '@modules/users/repositories/IUsersRepository';
import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';

@injectable()
export class CreateService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute(data: CreateUserDTO): Promise<UserResponseDTO> {
    const exists = await this.usersRepository.findByEmail(data.email);
    if (exists) throw new ConflictError('E-mail já cadastrado.');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.usersRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    const { passwordHash: _, ...response } = user;
    return response as UserResponseDTO;
  }
}

@injectable()
export class FindAllService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute(
    query?: FindAllQuery
  ): Promise<{ data: UserResponseDTO[]; total: number }> {
    const [users, total] = await Promise.all([
      this.usersRepository.findAll(query),
      this.usersRepository.count({ search: query?.search }),
    ]);

    const data = users.map(({ passwordHash: _, ...u }) => u as UserResponseDTO);
    return { data, total };
  }
}

@injectable()
export class FindOneService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute(id: string): Promise<UserResponseDTO> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado.');

    const { passwordHash: _, ...response } = user;
    return response as UserResponseDTO;
  }
}

@injectable()
export class UpdateService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado.');

    if (data.email && data.email !== user.email) {
      const conflict = await this.usersRepository.findByEmail(data.email);
      if (conflict) throw new ConflictError('E-mail já em uso.');
      user.email = data.email;
    }

    if (data.name) user.name = data.name;

    const updated = await this.usersRepository.update(user);
    const { passwordHash: _, ...response } = updated;
    return response as UserResponseDTO;
  }
}

@injectable()
export class DeleteService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado.');

    await this.usersRepository.delete(id);
  }
}
