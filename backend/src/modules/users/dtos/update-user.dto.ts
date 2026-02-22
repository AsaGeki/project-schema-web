import { z } from 'zod';

/**
 * Schema Zod para validação de atualização de usuário
 */
export const UpdateUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
});

/**
 * Tipo TS inferido do schema Zod
 */
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
