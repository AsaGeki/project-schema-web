import { z } from 'zod';

import type { IAuditFields } from '@shared/types/audit';

import type { User } from '@prisma/client';

export const userSchema = z.object({
  name: z
    .string({ error: 'Nome deve ser uma string válida' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  email: z.email('Email deve ser válido').trim().toLowerCase(),
  password: z
    .string({ error: 'Senha deve ser uma string válida' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(120, 'Senha deve ter no máximo 120 caracteres'),
  isAdmin: z.boolean({ error: 'isAdmin deve ser um boolean válido' }).optional(),
});

/** Contrato de entrada, derivado do schema para não duplicar campo à mão. */
export interface IUser extends z.infer<typeof userSchema> {}

/** O que o repositório grava: a entrada validada mais a autoria. */
export interface IUserCreate extends IUser, IAuditFields {}

/** Atualização parcial: todo campo é opcional. */
export const userPartialSchema = userSchema.partial();

export interface IUserPartial extends z.infer<typeof userPartialSchema> {}

/** O que o repositório grava numa atualização: a entrada parcial mais a autoria. */
export interface IUserUpdate extends IUserPartial, IAuditFields {}

/** Representação pública: é o que sai no boundary HTTP, sempre sem a senha. */
export interface IUserPublic extends Omit<User, 'password'> {}
