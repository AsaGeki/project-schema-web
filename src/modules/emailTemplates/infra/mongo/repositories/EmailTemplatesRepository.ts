import type {
  IEmailTemplateDocument,
  IEmailTemplateDTO,
  IEmailTemplatePublicacao,
} from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import type { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import { EmailTemplate } from '@modules/emailTemplates/infra/mongo/models/EmailTemplate';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import BaseMongoRepository from '@shared/infra/database/mongo/BaseMongoRepository';

import type { Model } from 'mongoose';

export default class EmailTemplatesRepository
  extends BaseMongoRepository<IEmailTemplateDocument, IEmailTemplateDTO>
  implements IEmailTemplatesRepository
{
  protected readonly model: Model<IEmailTemplateDocument> = EmailTemplate;

  public async findByFlag(flag: EFlagEmail): Promise<IEmailTemplateDocument | null> {
    return this.model.findOne({ flag }).exec();
  }

  public async upsertByFlag(
    flag: EFlagEmail,
    conteudo: IEmailTemplatePublicacao,
    autorId: string,
  ): Promise<IEmailTemplateDocument> {
    return this.model
      .findOneAndUpdate(
        { flag },
        { $set: { ...conteudo, updatedBy: autorId }, $setOnInsert: { flag, isActive: true, createdBy: autorId } },
        { new: true, upsert: true, runValidators: true },
      )
      .orFail()
      .exec();
  }
}
