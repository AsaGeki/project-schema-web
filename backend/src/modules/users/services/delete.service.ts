import { NotFoundError } from '@shared/errors';
import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '../repositories/i-user-repository';

/**
 * Service responsável por deletar um usuário
 */
@injectable()
export class DeleteService {
  constructor(
    @inject('UserRepository')
    private userRepository: IUserRepository
  ) {}

  async execute(id: string): Promise<void> {
    // Verificar se usuário existe
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    await this.userRepository.delete(id);
  }
}
