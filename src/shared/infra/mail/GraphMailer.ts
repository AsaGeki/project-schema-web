import fs from 'fs/promises';

import axios from 'axios';
import { injectable } from 'tsyringe';

import { env } from '@configs/envConfig';
import { InternalServerError, ServiceUnavailableError } from '@shared/errors/UniversalError';
import { singleFlight } from '@shared/infra/cache/singleFlight';
import type IMailer from '@shared/infra/mail/IMailer';
import type { ISendMailOptions } from '@shared/infra/mail/IMailer';
import { logger } from '@shared/services/LoggerService';
import { detectarFormato } from '@shared/utils/files/detectarFormato';

const log = logger.child({ prefix: 'mail' });

/** Renova o token antes do vencimento documentado, para não usar um que expira no meio do envio. */
const FOLGA_DO_TOKEN_MS = 60 * 1000;
const TIMEOUT_MS = 30 * 1000;

const acessoNegado = () =>
  new InternalServerError({
    message: 'O Microsoft Graph negou o acesso com a credencial configurada.',
    code: 'EMAIL_ACESSO_NEGADO',
  });

const indisponivel = () =>
  new ServiceUnavailableError({ message: 'Não foi possível enviar o e-mail agora.', code: 'EMAIL_INDISPONIVEL' });

function statusDa(error: unknown): number | undefined {
  return (error as { response?: { status?: number } }).response?.status;
}

function enderecos(lista: string[]) {
  return lista.map(address => ({ emailAddress: { address } }));
}

/**
 * Único ponto que conhece a API de e-mail do Microsoft Graph: login por
 * `client_credentials` e `POST /users/{remetente}/sendMail`. Registrado como
 * singleton; envios simultâneos com o token vencido fazem um login só.
 */
@injectable()
export default class GraphMailer implements IMailer {
  private token: { valor: string; expiraEm: number } | undefined;

  public async enviar(opcoes: ISendMailOptions): Promise<void> {
    const { GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER } = env.mail;

    if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !GRAPH_SENDER) {
      throw new ServiceUnavailableError({
        message: 'O envio de e-mail pelo Microsoft Graph não está configurado.',
        code: 'EMAIL_NAO_CONFIGURADO',
      });
    }

    const token = await this.obterToken();

    // O Graph não aceita caminho de disco: cada anexo vai em base64 no corpo.
    const anexos = await Promise.all(
      (opcoes.attachments ?? []).map(async anexo => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: anexo.filename,
        contentType: (await detectarFormato(anexo.path))?.mime ?? 'application/octet-stream',
        contentBytes: (await fs.readFile(anexo.path)).toString('base64'),
        ...(anexo.cid && { isInline: true, contentId: anexo.cid }),
      })),
    );

    try {
      await axios.post(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(GRAPH_SENDER)}/sendMail`,
        {
          message: {
            subject: opcoes.subject,
            body: { contentType: 'HTML', content: opcoes.html },
            toRecipients: enderecos(opcoes.to),
            ...(opcoes.cc?.length && { ccRecipients: enderecos(opcoes.cc) }),
            ...(anexos.length > 0 && { attachments: anexos }),
          },
          saveToSentItems: false,
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: TIMEOUT_MS },
      );
    } catch (error) {
      const status = statusDa(error);
      log.error(`Envio pelo Graph para ${opcoes.to.join(', ')} falhou: ${status ?? (error as Error).message}`);

      if (status === 403) throw acessoNegado();
      // Token recusado antes do prazo: descartado, o próximo envio faz login de novo.
      if (status === 401) this.token = undefined;
      throw indisponivel();
    }

    log.info(`E-mail enviado pelo Graph para ${opcoes.to.join(', ')}.`);
  }

  private async obterToken(): Promise<string> {
    if (this.token && this.token.expiraEm > Date.now()) return this.token.valor;

    return singleFlight('graph-mail-login', async () => {
      try {
        const { data } = await axios.post<{ access_token: string; expires_in: number }>(
          `https://login.microsoftonline.com/${env.mail.GRAPH_TENANT_ID}/oauth2/v2.0/token`,
          new URLSearchParams({
            client_id: env.mail.GRAPH_CLIENT_ID,
            client_secret: env.mail.GRAPH_CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials',
          }),
          { timeout: TIMEOUT_MS },
        );

        this.token = { valor: data.access_token, expiraEm: Date.now() + data.expires_in * 1000 - FOLGA_DO_TOKEN_MS };
        return data.access_token;
      } catch (error) {
        const status = statusDa(error);
        log.error(`Login no Graph falhou: ${status ?? (error as Error).message}`);
        throw status === 400 || status === 401 || status === 403 ? acessoNegado() : indisponivel();
      }
    });
  }
}
