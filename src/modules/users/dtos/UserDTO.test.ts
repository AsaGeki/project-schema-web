import { describe, expect, it } from 'vitest';

import { userPartialSchema, userSchema } from './UserDTO';

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
  it('aceita isAdmin boolean, conferido depois no UpdateService', () => {
    expect(userPartialSchema.parse({ isAdmin: true })).toEqual({ isAdmin: true });
  });

  it('recusa isAdmin que não é boolean', () => {
    expect(userPartialSchema.safeParse({ isAdmin: 'true' }).success).toBe(false);
  });
});
