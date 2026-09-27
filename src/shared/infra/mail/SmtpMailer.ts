import nodemailer from 'nodemailer';
import { injectable } from 'tsyringe';

import { env, isProduction } from '@configs/envConfig';
import { ServiceUnavailableError } from '@shared/errors/UniversalError';
import type IMailer from '@shared/infra/mail/IMailer';
import type { ISendMailOptions } from '@shared/infra/mail/IMailer';
import { logger } from '@shared/services/LoggerService';

import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const log = logger.child({ prefix: 'mail' });

@injectable()
export default class SmtpMailer implements IMailer {
  private transporte?: Transporter<SMTPTransport.SentMessageInfo>;

  public async enviar(opcoes: ISendMailOptions): Promise<void> {
    try {
      const transporte = await this.obterTransporte();
      const info = await transporte.sendMail({
        ...opcoes,
        from: `"${env.mail.SMTP_FROM_NAME}" <${env.mail.SMTP_FROM_EMAIL}>`,
      });

      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) log.info(`Preview do e-mail (Ethereal): ${preview}`);
    } catch (error) {
      log.error(`Falha no envio por SMTP para ${opcoes.to.join(', ')}: ${(error as Error).message}`);
      throw new ServiceUnavailableError({
        message: 'Não foi possível enviar o e-mail agora.',
        code: 'EMAIL_INDISPONIVEL',
      });
    }
  }

  /** Preguiçoso: a conta de teste do Ethereal só é criada no primeiro envio. */
  private async obterTransporte(): Promise<Transporter<SMTPTransport.SentMessageInfo>> {
    if (this.transporte) return this.transporte;

    if (!isProduction && !env.mail.SMTP_HOST) {
      const conta = await nodemailer.createTestAccount();
      this.transporte = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: conta.user, pass: conta.pass },
      });
      log.info(`Conta de teste do Ethereal: ${conta.user}`);
    } else {
      this.transporte = nodemailer.createTransport({
        host: env.mail.SMTP_HOST,
        port: env.mail.SMTP_PORT,
        secure: env.mail.SMTP_SECURE,
        auth: env.mail.SMTP_USER ? { user: env.mail.SMTP_USER, pass: env.mail.SMTP_PASSWORD } : undefined,
      });
    }

    return this.transporte;
  }
}
