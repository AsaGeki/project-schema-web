import { NotFoundError } from '@shared/errors';
import { inject, injectable } from 'tsyringe';
import { UserResponseDTO } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import {
  FindOneOptions,
  IUserRepository,
} from '../repositories/i-user-repository';

/**
 * Service responsável por buscar um único usuário por ID
 */
@injectable()
export class FindOneService {
  constructor(
    @inject('UserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(
    id: string,
    options?: FindOneOptions
  ): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id, options);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    return this.mapToResponse(user);
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
