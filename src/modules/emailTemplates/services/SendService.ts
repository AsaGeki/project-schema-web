import Handlebars from 'handlebars';
import { inject, injectable } from 'tsyringe';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import type { IEmailEnvio, IEmailResolver } from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';
import UsuarioCriadoResolver from '@modules/emailTemplates/resolvers/UsuarioCriadoResolver';
import { NotFoundError, UnprocessableEntityError } from '@shared/errors/UniversalError';
import type IMailer from '@shared/infra/mail/IMailer';
import type { IAnexoEmail } from '@shared/infra/mail/IMailer';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import { logger } from '@shared/services/LoggerService';
import type { IResponseEx } from '@shared/types/response';
import { removerTagsHtml } from '@shared/utils/html/removerTagsHtml';

const log = logger.child({ prefix: 'email-templates' });

@injectable()
export default class SendService {
  private readonly resolvers: Record<EFlagEmail, IEmailResolver>;

  constructor(
    @inject('EmailTemplatesRepository')
    private readonly repository: IEmailTemplatesRepository,
    @inject('ArquivosRepository')
    private readonly arquivosRepository: IArquivosRepository,
    @inject('FileStorage')
    private readonly storage: IFileStorage,
    @inject('Mailer')
    private readonly mailer: IMailer,
    @inject(UsuarioCriadoResolver)
    usuarioCriadoResolver: UsuarioCriadoResolver,
  ) {
    this.resolvers = { [EFlagEmail.USUARIO_CRIADO]: usuarioCriadoResolver };
  }

  public async execute(
    flag: string,
    envio: IEmailEnvio,
    autorId: string,
  ): Promise<IResponseEx<{ destinatarios: string[] }>> {
    const flagValida = Object.values(EFlagEmail).includes(flag as EFlagEmail);
    const template = flagValida ? await this.repository.findByFlag(flag as EFlagEmail) : null;

    if (!template?.isActive) {
      throw new NotFoundError({ message: 'Flag de e-mail inexistente, sem template publicado ou desligada.' });
    }

    const resolvido = await this.resolvers[flag as EFlagEmail].execute({
      ids: envio.ids,
      ...(envio.destinatarios && { destinatarios: envio.destinatarios }),
      autorId,
    });

    const informados = envio.destinatarios ?? [];
    const sugeridos = resolvido.destinatarios ?? [];
    const to = informados.length > 0 ? informados : sugeridos.length > 0 ? sugeridos : template.destinatariosFixos;

    if (to.length === 0) {
      throw new UnprocessableEntityError({
        message: 'Informe ao menos um destinatário: esta flag não tem destinatários fixos.',
        code: 'SEM_DESTINATARIO',
      });
    }

    const attachments = [
      ...(await this.anexar(template.anexos, false)),
      ...(await this.anexar(template.imagensInline, true)),
    ];

    // `{{ }}` do Handlebars escapa HTML: dado do domínio não vira marcação no e-mail.
    const subject = Handlebars.compile(template.assunto)(resolvido.dados);
    const html = Handlebars.compile(template.htmlRenderizado)(resolvido.dados);

    await this.mailer.enviar({
      to,
      cc: template.destinatariosFixos.filter(email => !to.includes(email)),
      subject,
      html,
      text: removerTagsHtml(html),
      attachments,
    });

    await resolvido.posEnvio?.(to);

    log.info(`E-mail da flag '${flag}' enviado para ${to.join(', ')} por ${autorId}.`);

    return {
      success: true,
      status: 200,
      message: `E-mail enviado para ${to.join(', ')}.`,
      data: { destinatarios: to },
    };
  }

  /** Repetido para anexos e imagens; a imagem vai com `cid` igual ao id, que o HTML referencia. */
  private async anexar(ids: string[], inline: boolean): Promise<IAnexoEmail[]> {
    return Promise.all(
      ids.map(async id => {
        const arquivo = await this.arquivosRepository.findById(id);

        if (!arquivo) {
          throw new UnprocessableEntityError({
            message: 'Um arquivo do template não existe mais. Publique o template de novo.',
            code: 'ANEXO_INEXISTENTE',
          });
        }

        return {
          filename: arquivo.nomeOriginal,
          path: this.storage.path(arquivo.arquivo),
          ...(inline && { cid: id }),
        };
      }),
    );
  }
}
