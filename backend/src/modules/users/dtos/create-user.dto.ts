import { z } from 'zod';

/**
 * Schema Zod para validação de criação de usuário
 */
export const CreateUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

/**
 * Tipo TS inferido do schema Zod
 */
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
