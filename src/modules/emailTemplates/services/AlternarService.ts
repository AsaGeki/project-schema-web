import { inject, injectable } from 'tsyringe';

import type { IEmailTemplateDocument } from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import { NotFoundError } from '@shared/errors/UniversalError';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';

const log = logger.child({ prefix: 'email-templates' });

@injectable()
export default class AlternarService {
  constructor(
    @inject('EmailTemplatesRepository')
    private readonly repository: IEmailTemplatesRepository,
  ) {}

  public async execute(flag: string, isActive: boolean, autorId: string): Promise<IResponseEx<IEmailTemplateDocument>> {
    const template = Object.values(EFlagEmail).includes(flag as EFlagEmail)
      ? await this.repository.findByFlag(flag as EFlagEmail)
      : null;

    if (!template) {
      throw new NotFoundError({ message: 'Flag de e-mail inexistente ou sem template publicado.' });
    }

    const atualizado = await this.repository.update(String(template.id), { isActive, updatedBy: autorId });

    if (!atualizado) {
      throw new NotFoundError({ message: 'Flag de e-mail inexistente ou sem template publicado.' });
    }

    log.info(`Template de e-mail '${flag}' ${isActive ? 'ligado' : 'desligado'} por ${autorId}.`);

    return { success: true, status: 200, data: atualizado };
  }
}
