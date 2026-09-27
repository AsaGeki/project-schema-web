export interface IAnexoEmail {
  filename: string;
  /** Caminho absoluto do arquivo no disco. */
  path: string;
  /** Presente quando o HTML referencia o anexo como `cid:<cid>`. */
  cid?: string;
}

export interface ISendMailOptions {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: IAnexoEmail[];
}

/** Porta de envio de e-mail. O adaptador sai de `MAIL_PROVIDER`, registrado com o token `Mailer`. */
export default interface IMailer {
  enviar(opcoes: ISendMailOptions): Promise<void>;
}
