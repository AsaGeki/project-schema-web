import { inject, injectable } from 'tsyringe';
import { UserResponseDTO } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import {
  FindAllQuery,
  IUserRepository,
} from '../repositories/i-user-repository';

/**
 * Service responsável por listar todos os usuários com paginação
 */
@injectable()
export class FindAllService {
  constructor(
    @inject('UserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(
    query?: FindAllQuery
  ): Promise<{ data: UserResponseDTO[]; total: number }> {
    const users = await this.userRepository.findAll(query);
    const total = await this.userRepository.count({
      search: query?.search,
    });

    const data = users.map(this.mapToResponse);

    return { data, total };
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
