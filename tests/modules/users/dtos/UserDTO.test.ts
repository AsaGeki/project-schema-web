import { describe, expect, it } from 'vitest';

import { userPartialSchema, userSchema } from '@modules/users/dtos/UserDTO';

const cadastroValido = { name: 'Arthur', email: 'arthur@exemplo.com', password: '12345678' };

describe('userSchema (cadastro público)', () => {
  it.each([true, 'true'])('descarta isAdmin = %j', isAdmin => {
    const resultado = userSchema.parse({ ...cadastroValido, isAdmin });

    expect(resultado).not.toHaveProperty('isAdmin');
  });

  it('normaliza o e-mail para minúsculas', () => {
    expect(userSchema.parse({ ...cadastroValido, email: 'Arthur@Exemplo.COM' }).email).toBe('arthur@exemplo.com');
  });

  it('recusa e-mail sem domínio de topo', () => {
    expect(userSchema.safeParse({ ...cadastroValido, email: 'admin@local' }).success).toBe(false);
  });

  it('recusa senha com menos de 8 caracteres', () => {
    expect(userSchema.safeParse({ ...cadastroValido, password: '1234567' }).success).toBe(false);
  });
});

describe('userPartialSchema (atualização)', () => {
  it('descarta isAdmin: perfil é atribuído pela rota própria', () => {
    expect(userPartialSchema.parse({ name: 'Arthur', isAdmin: true })).toEqual({ name: 'Arthur' });
  });
});
