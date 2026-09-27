import type {
  IEmailTemplateDocument,
  IEmailTemplateDTO,
  IEmailTemplatePublicacao,
} from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import type { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type { IMongoRepository } from '@shared/infra/database/IBaseRepository';

/** Templates por flag. A publicação é `upsert`, que só o Mongo faz num comando só. */
export default interface IEmailTemplatesRepository extends IMongoRepository<IEmailTemplateDocument, IEmailTemplateDTO> {
  findByFlag(flag: EFlagEmail): Promise<IEmailTemplateDocument | null>;
  /** Cria ativo na primeira publicação; depois só troca o conteúdo e o `updatedBy`. */
  upsertByFlag(flag: EFlagEmail, conteudo: IEmailTemplatePublicacao, autorId: string): Promise<IEmailTemplateDocument>;
}
