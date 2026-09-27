import { z } from 'zod';

import type { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';

import type { Document } from 'mongoose';

const idDeArquivo = z
  .string({ error: 'Arquivo deve ser um id válido' })
  .regex(/^[0-9a-f]{24}$/i, 'Arquivo deve ser o id de um registro do módulo arquivos');

/** Publicação grava os quatro campos de conteúdo juntos; as listas substituem as anteriores. */
export const publicarTemplateSchema = z.object({
  titulo: z.string({ error: 'Título deve ser uma string válida' }).trim().min(1, 'Título é obrigatório').max(120),
  /** JSON do editor do front, guardado como veio. */
  structure: z.record(z.string(), z.unknown(), { error: 'Structure deve ser um objeto' }),
  htmlRenderizado: z.string({ error: 'HTML deve ser uma string válida' }).min(1, 'HTML é obrigatório'),
  assunto: z.string({ error: 'Assunto deve ser uma string válida' }).trim().min(1, 'Assunto é obrigatório').max(200),
  anexos: z.array(idDeArquivo).max(5, 'Um template aceita no máximo 5 anexos').default([]),
  /** Imagens que o HTML referencia como `cid:<id>`. */
  imagensInline: z.array(idDeArquivo).max(20, 'Um template aceita no máximo 20 imagens').default([]),
  destinatariosFixos: z.array(z.email('Destinatário fixo deve ser um e-mail válido')).max(50).default([]),
});

export interface IEmailTemplatePublicacao extends z.infer<typeof publicarTemplateSchema> {}

export const alternarTemplateSchema = z.object({
  isActive: z.boolean({ error: 'isActive deve ser um boolean válido' }),
});

export interface IEmailTemplateAlternancia extends z.infer<typeof alternarTemplateSchema> {}

export const enviarEmailSchema = z.object({
  /** Registros que o resolver da flag usa para montar os dados. */
  ids: z.array(z.string().trim().min(1)).max(50).default([]),
  /** Sem destinatários, vale o que o resolver devolve e, depois, a lista fixa do template. */
  destinatarios: z.array(z.email('Destinatário deve ser um e-mail válido')).max(50).optional(),
});

export interface IEmailEnvio extends z.infer<typeof enviarEmailSchema> {}

/** Template como fica no Mongo. */
export interface IEmailTemplateDTO extends IEmailTemplatePublicacao {
  flag: EFlagEmail;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface IEmailTemplateDocument extends IEmailTemplateDTO, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IContextoEnvioEmail {
  ids: string[];
  destinatarios?: string[];
  autorId: string;
}

export interface IEmailResolvido {
  /** Destinatários sugeridos pelo domínio, usados quando o envio não informa nenhum. */
  destinatarios?: string[];
  /** Dados que o Handlebars aplica no assunto e no HTML. */
  dados: Record<string, unknown>;
  /** Chamado depois do envio, com o `to` efetivo. */
  posEnvio?: (destinatarios: string[]) => Promise<void>;
}

/** Busca os dados do domínio de uma flag. Um resolver por flag. */
export interface IEmailResolver {
  execute(contexto: IContextoEnvioEmail): Promise<IEmailResolvido>;
}
