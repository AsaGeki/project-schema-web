import { z } from 'zod';

import type { IAuditFields } from '@shared/types/audit';

export const perfilSchema = z.object({
  nome: z
    .string({ error: 'Nome deve ser uma string válida' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres'),
  descricao: z
    .string({ error: 'Descrição deve ser uma string válida' })
    .trim()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  /** Permissões no formato `grupo:acao`, conferidas contra o catálogo no service. */
  permissoes: z
    .array(z.string({ error: 'Permissão deve ser uma string válida' }).trim(), {
      error: 'Permissões deve ser uma lista',
    })
    .max(200, 'Um perfil tem no máximo 200 permissões'),
});

export interface IPerfil extends z.infer<typeof perfilSchema> {}

export const perfilPartialSchema = perfilSchema.partial();

export interface IPerfilPartial extends z.infer<typeof perfilPartialSchema> {}

/** O que o repositório grava: as permissões já traduzidas para os ids do banco. */
export interface IPerfilCreate extends Omit<IPerfil, 'permissoes'>, IAuditFields {
  permissaoIds: string[];
}

/** Atualização parcial; `permissaoIds`, quando vem, substitui todas as permissões do perfil. */
export interface IPerfilUpdate extends Omit<IPerfilPartial, 'permissoes'>, IAuditFields {
  permissaoIds?: string[];
}

/** Perfil como sai na resposta, com as permissões em `grupo:acao`. */
export interface IPerfilPublico {
  id: string;
  nome: string;
  descricao: string | null;
  todasPermissoes: boolean;
  permissoes: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Permissões de um usuário somadas de todos os perfis dele. */
export interface IPermissoesResolvidas {
  todasPermissoes: boolean;
  permissoes: string[];
}
