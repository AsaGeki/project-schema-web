import type { Document } from 'mongoose';

/** Arquivo enviado, como fica no Mongo. O conteúdo mora no `IFileStorage`; aqui só a key. */
export interface IArquivoDTO {
  nomeOriginal: string;
  /** Key no `IFileStorage`. O download sai pela rota do arquivo, nunca por este caminho. */
  arquivo: string;
  /** Detectado pelos bytes, não o que o cliente declarou. */
  mimeType: string;
  tamanhoBytes: number;
  /** Do arquivo como foi gravado: barra o mesmo conteúdo duas vezes para o mesmo usuário. */
  hashSha256: string;
  /** Id do usuário que enviou. */
  createdBy: string;
}

export interface IArquivoDocument extends IArquivoDTO, Document {
  createdAt: Date;
  updatedAt: Date;
  /** Rota de download, calculada pelo model. */
  url: string;
}

/** O que o controller precisa para responder o download. */
export interface IArquivoParaDownload {
  caminho: string;
  nome: string;
}
