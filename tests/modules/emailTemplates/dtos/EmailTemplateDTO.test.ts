import { describe, expect, it } from 'vitest';

import { enviarEmailSchema, publicarTemplateSchema } from '@modules/emailTemplates/dtos/EmailTemplateDTO';

const publicacao = {
  titulo: 'Boas-vindas',
  structure: { blocos: [] },
  htmlRenderizado: '<p>Olá, {{usuario.nome}}</p>',
  assunto: 'Bem-vindo, {{usuario.nome}}',
};

describe('publicarTemplateSchema', () => {
  it('completa as listas vazias', () => {
    expect(publicarTemplateSchema.parse(publicacao)).toEqual({
      ...publicacao,
      anexos: [],
      imagensInline: [],
      destinatariosFixos: [],
    });
  });

  it('recusa mais de 5 anexos, id que não é de arquivo e destinatário fixo inválido', () => {
    const id = '0123456789abcdef01234567';

    expect(publicarTemplateSchema.safeParse({ ...publicacao, anexos: Array(6).fill(id) }).success).toBe(false);
    expect(publicarTemplateSchema.safeParse({ ...publicacao, anexos: ['x'] }).success).toBe(false);
    expect(publicarTemplateSchema.safeParse({ ...publicacao, destinatariosFixos: ['sem-arroba'] }).success).toBe(false);
  });

  it('exige os quatro campos de conteúdo', () => {
    expect(publicarTemplateSchema.safeParse({ ...publicacao, assunto: '' }).success).toBe(false);
  });
});

describe('enviarEmailSchema', () => {
  it('ids vazios por padrão; destinatários, quando vêm, são e-mails', () => {
    expect(enviarEmailSchema.parse({})).toEqual({ ids: [] });
    expect(enviarEmailSchema.safeParse({ destinatarios: ['não é e-mail'] }).success).toBe(false);
  });
});
