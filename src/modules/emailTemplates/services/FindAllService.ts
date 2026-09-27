import { inject, injectable } from 'tsyringe';

import type { IFlagEmail } from '@modules/emailTemplates/catalogoFlags';
import { CATALOGO_FLAGS } from '@modules/emailTemplates/catalogoFlags';
import type { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import type { IResponseEx } from '@shared/types/response';

/** Flag do catálogo com o estado do template dela. */
export interface IFlagEmailResumo extends IFlagEmail {
  flag: EFlagEmail;
  publicado: boolean;
  isActive: boolean;
}

@injectable()
export default class FindAllService {
  constructor(
    @inject('EmailTemplatesRepository')
    private readonly repository: IEmailTemplatesRepository,
  ) {}

  public async execute(): Promise<IResponseEx<IFlagEmailResumo[]>> {
    const flags = Object.entries(CATALOGO_FLAGS) as [EFlagEmail, IFlagEmail][];

    const resumo = await Promise.all(
      flags.map(async ([flag, metadados]) => {
        const template = await this.repository.findByFlag(flag);
        return { flag, ...metadados, publicado: template !== null, isActive: template?.isActive ?? false };
      }),
    );

    return { success: true, status: 200, data: resumo };
  }
}
