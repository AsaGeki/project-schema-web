import { z } from 'zod';

import type { IAuditFields } from '@shared/types/audit';

import type { Document } from 'mongoose';

export const logSchema = z.object({
  /** Evento no formato `<recurso>.<ação>`, ex.: `user.create`. */
  action: z.string({ error: 'Ação deve ser uma string válida' }).trim().min(1, 'Ação é obrigatória'),
  /** Agrupador do evento, normalmente o nome do módulo. */
  category: z.string({ error: 'Categoria deve ser uma string válida' }).trim().min(1, 'Categoria é obrigatória'),
  message: z.string({ error: 'Mensagem deve ser uma string válida' }).trim().min(1, 'Mensagem é obrigatória'),
  /** Identificador do registro afetado, quando o evento tem alvo. */
  targetId: z.string({ error: 'Alvo deve ser uma string válida' }).trim().optional(),
  /** Conteúdo livre do evento — é o que torna o log documental em vez de relacional. */
  payload: z.unknown().optional(),
});

export interface ILog extends z.infer<typeof logSchema> {}

/** O que o repositório grava: a entrada validada mais a autoria. */
export interface ILogCreate extends ILog, IAuditFields {}

/** Documento persistido: o contrato de domínio mais o que o Mongoose acrescenta. */
export interface ILogDocument extends ILog, IAuditFields, Document {
  createdAt: Date;
  updatedAt: Date;
}
