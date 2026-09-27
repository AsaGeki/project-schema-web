import { inject, injectable } from 'tsyringe';

import type { IEmailTemplateDocument } from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import { NotFoundError } from '@shared/errors/UniversalError';
import type { IResponseEx } from '@shared/types/response';

@injectable()
export default class FindByFlagService {
  constructor(
    @inject('EmailTemplatesRepository')
    private readonly repository: IEmailTemplatesRepository,
  ) {}

  public async execute(flag: string): Promise<IResponseEx<IEmailTemplateDocument>> {
    const flagValida = Object.values(EFlagEmail).includes(flag as EFlagEmail);
    const template = flagValida ? await this.repository.findByFlag(flag as EFlagEmail) : null;

    // Uma mensagem só: de fora não se distingue flag inexistente de template não publicado.
    if (!template) {
      throw new NotFoundError({ message: 'Flag de e-mail inexistente ou sem template publicado.' });
    }

    return { success: true, status: 200, data: template };
  }
}
