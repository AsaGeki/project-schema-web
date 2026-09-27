import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';
import { EmailTemplate } from '@modules/emailTemplates/infra/mongo/models/EmailTemplate';
import EmailTemplatesRepository from '@modules/emailTemplates/infra/mongo/repositories/EmailTemplatesRepository';

const repository = new EmailTemplatesRepository();

const conteudo = {
  titulo: 'Boas-vindas',
  structure: { blocos: [] },
  htmlRenderizado: '<p>Olá</p>',
  assunto: 'Bem-vindo',
  anexos: [],
  imagensInline: [],
  destinatariosFixos: ['equipe@exemplo.com'],
};

describe('EmailTemplatesRepository (Mongo real)', () => {
  beforeAll(async () => {
    await connectMongo();
    await EmailTemplate.init();
  });

  beforeEach(async () => {
    await EmailTemplate.deleteMany({});
  });

  afterAll(async () => {
    await EmailTemplate.deleteMany({});
    await disconnectMongo();
  });

  it('a primeira publicação cria o template ativo, com o autor', async () => {
    const criado = await repository.upsertByFlag(EFlagEmail.USUARIO_CRIADO, conteudo, 'u-1');

    expect(criado).toMatchObject({ flag: 'usuario_criado', isActive: true, createdBy: 'u-1', updatedBy: 'u-1' });
    expect(await repository.findByFlag(EFlagEmail.USUARIO_CRIADO)).toMatchObject({ assunto: 'Bem-vindo' });
  });

  it('publicar de novo atualiza o conteúdo sem duplicar, mantendo o criador e o estado', async () => {
    await repository.upsertByFlag(EFlagEmail.USUARIO_CRIADO, conteudo, 'u-1');
    await EmailTemplate.updateOne({ flag: EFlagEmail.USUARIO_CRIADO }, { isActive: false });

    const atualizado = await repository.upsertByFlag(
      EFlagEmail.USUARIO_CRIADO,
      { ...conteudo, assunto: 'Novo' },
      'u-2',
    );

    expect(atualizado).toMatchObject({ assunto: 'Novo', isActive: false, createdBy: 'u-1', updatedBy: 'u-2' });
    expect(await repository.count()).toBe(1);
  });

  it('flag sem template devolve null', async () => {
    expect(await repository.findByFlag(EFlagEmail.USUARIO_CRIADO)).toBeNull();
  });
});
