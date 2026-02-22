import { BadRequestError, ConflictError } from '@shared/errors';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { inject, injectable } from 'tsyringe';
import { CreateUserDTO, CreateUserSchema } from '../dtos/create-user.dto';
import { UserResponseDTO } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/i-user-repository';

/**
 * Service responsável por criar um novo usuário
 */
@injectable()
export class CreateService {
  constructor(
    @inject('UserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(data: CreateUserDTO): Promise<UserResponseDTO> {
    // Validar com Zod
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(firstError.message);
    }

    // Verificar se e-mail já existe
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('E-mail já cadastrado');
    }

    // Hash da senha
    const passwordHash = await hash(data.password, 10);

    // Criar usuário
    const user = new User();
    user.id = randomUUID();
    user.name = data.name;
    user.email = data.email;
    user.passwordHash = passwordHash;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    const created = await this.userRepository.create(user);

    return this.mapToResponse(created);
  }

  private mapToResponse(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
