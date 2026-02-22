import { BadRequestError, ConflictError, NotFoundError } from '@shared/errors';
import { inject, injectable } from 'tsyringe';
import { UpdateUserDTO, UpdateUserSchema } from '../dtos/update-user.dto';
import { UserResponseDTO } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/i-user-repository';

/**
 * Service responsável por atualizar um usuário existente
 */
@injectable()
export class UpdateService {
  constructor(
    @inject('UserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    // Validar com Zod
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(firstError.message);
    }

    // Buscar usuário
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Se e-mail foi alterado, verificar se já existe
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError('E-mail já cadastrado');
      }
      user.email = data.email;
    }

    // Atualizar nome se fornecido
    if (data.name) {
      user.name = data.name;
    }

    user.updatedAt = new Date();

    const updated = await this.userRepository.update(user);

    return this.mapToResponse(updated);
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
