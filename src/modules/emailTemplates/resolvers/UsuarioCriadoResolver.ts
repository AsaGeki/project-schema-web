import { inject, injectable } from 'tsyringe';

import type {
  IContextoEnvioEmail,
  IEmailResolver,
  IEmailResolvido,
} from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import type IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { NotFoundError } from '@shared/errors/UniversalError';

/** Flag `usuario_criado`: o primeiro id é o usuário, que também é o destinatário sugerido. */
@injectable()
export default class UsuarioCriadoResolver implements IEmailResolver {
  constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  public async execute({ ids }: IContextoEnvioEmail): Promise<IEmailResolvido> {
    const [id] = ids;
    const usuario = id ? await this.usersRepository.findById(id) : null;

    if (!usuario) {
      throw new NotFoundError({ message: 'Usuário do e-mail não encontrado.' });
    }

    return {
      destinatarios: [usuario.email],
      dados: { usuario: { nome: usuario.name, email: usuario.email } },
    };
  }
}
