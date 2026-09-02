import { inject, injectable } from 'tsyringe';

import type { IUser, IUserPublic } from '@modules/users/dtos/UserDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { ConflictError } from '@shared/errors/UniversalError';
import type HashService from '@shared/services/HashService';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'users' });

@injectable()
export default class CreateService {
  constructor(
    @inject('UsersRepository')
    private readonly repository: IUsersRepository,
    @inject('HashService')
    private readonly hashService: HashService,
  ) {}

  public async execute(data: IUser, authorId?: string): Promise<IResponseEx<IUserPublic>> {
    const existing = await this.repository.findByEmail(data.email);

    if (existing) {
      throw new ConflictError({ message: 'Já existe um usuário cadastrado com esse email.' });
    }

    const password = await this.hashService.hash(data.password);

    const created = await this.repository.create({
      ...data,
      password,
      isAdmin: data.isAdmin ?? false,
      createdBy: authorId ?? null,
    });

    log.info(`Usuário ${created.email} criado.`);

    return { success: true, status: 201, message: 'Usuário criado com sucesso!', data: created };
  }
}
