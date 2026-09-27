import fs from 'fs/promises';
import path from 'path';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { container } from 'tsyringe';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { prisma } from '@configs/database/prismaClient';
import { env } from '@configs/envConfig';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';
import type IMailer from '@shared/infra/mail/IMailer';
import type { ISendMailOptions } from '@shared/infra/mail/IMailer';

import { type IServidorDeTeste, subirApp } from '../../../../../subirApp';

const TODAS = [
  'arquivos:create',
  'emailTemplates:read',
  'emailTemplates:publish',
  'emailTemplates:activate',
  'emailTemplates:send',
];
const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
const enviados: ISendMailOptions[] = [];

function autenticarComo(abilities: string[]): string {
  container.registerInstance<IResolvedorDePermissoes>('ResolvedorDePermissoes', {
    execute: () => Promise.resolve(abilities),
  });
  container.registerInstance<IMailer>('Mailer', {
    enviar: opcoes => {
      enviados.push(opcoes);
      return Promise.resolve();
    },
  });
  return `Bearer ${jwt.sign({ sub: 'u-autor' }, env.auth.JWT_SECRET)}`;
}

function chamar(servidor: IServidorDeTeste, token: string, metodo: string, caminho: string, corpo?: object) {
  return fetch(`${servidor.url}/api/email-templates${caminho}`, {
    method: metodo,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    ...(corpo && { body: JSON.stringify(corpo) }),
  });
}

describe('rotas de templates de e-mail (Mongo, Postgres e disco reais)', () => {
  let servidor: IServidorDeTeste | undefined;

  beforeAll(async () => {
    await connectMongo();
  });

  beforeEach(async () => {
    enviados.length = 0;
    await mongoose.connection.collection('email_templates').deleteMany({});
    await mongoose.connection.collection('arquivos').deleteMany({});
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await servidor?.fechar();
    servidor = undefined;
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await mongoose.connection.collection('email_templates').deleteMany({});
    await mongoose.connection.collection('arquivos').deleteMany({});
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await fs.rm(path.resolve(env.uploads.UPLOADS_DIR), { recursive: true, force: true });
    await disconnectMongo();
  });

  it('publica com anexo, envia para o usuário e o mailer recebe o e-mail montado', async () => {
    servidor = await subirApp();
    const token = autenticarComo(TODAS);
    const usuario = await prisma.user.create({
      data: { name: 'Arthur <b>', email: 'arthur@exemplo.com', password: 'x' },
    });

    const corpoEnvio = new FormData();
    corpoEnvio.append('arquivos', new Blob([PDF]), 'contrato.pdf');
    const upload = await fetch(`${servidor.url}/api/arquivos`, {
      method: 'POST',
      headers: { Authorization: token },
      body: corpoEnvio,
    });
    const {
      data: [arquivo],
    } = (await upload.json()) as { data: [{ _id: string }] };

    const publicacao = await chamar(servidor, token, 'PUT', '/usuario_criado', {
      titulo: 'Boas-vindas',
      structure: { blocos: [] },
      htmlRenderizado: '<p>Olá, {{usuario.nome}}</p>',
      assunto: 'Bem-vindo, {{usuario.nome}}',
      anexos: [arquivo._id],
      destinatariosFixos: ['equipe@exemplo.com'],
    });
    expect(publicacao.status).toBe(200);

    const envio = await chamar(servidor, token, 'POST', '/usuario_criado/envios', { ids: [usuario.id] });
    expect(envio.status).toBe(200);

    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toMatchObject({
      to: ['arthur@exemplo.com'],
      cc: ['equipe@exemplo.com'],
      subject: 'Bem-vindo, Arthur <b>',
      html: '<p>Olá, Arthur &lt;b&gt;</p>',
      attachments: [{ filename: 'contrato.pdf' }],
    });
    await expect(fs.access(enviados[0]?.attachments?.[0]?.path ?? '')).resolves.toBeUndefined();
  });

  it('desligado, o envio responde 404; religado, volta a enviar', async () => {
    servidor = await subirApp();
    const token = autenticarComo(TODAS);
    const usuario = await prisma.user.create({ data: { name: 'Arthur', email: 'arthur@exemplo.com', password: 'x' } });
    await chamar(servidor, token, 'PUT', '/usuario_criado', {
      titulo: 'Boas-vindas',
      structure: {},
      htmlRenderizado: '<p>Oi</p>',
      assunto: 'Oi',
    });

    expect((await chamar(servidor, token, 'PATCH', '/usuario_criado/ativo', { isActive: false })).status).toBe(200);
    expect((await chamar(servidor, token, 'POST', '/usuario_criado/envios', { ids: [usuario.id] })).status).toBe(404);

    await chamar(servidor, token, 'PATCH', '/usuario_criado/ativo', { isActive: true });
    expect((await chamar(servidor, token, 'POST', '/usuario_criado/envios', { ids: [usuario.id] })).status).toBe(200);
  });

  it('a listagem mostra a flag do catálogo e se está publicada', async () => {
    servidor = await subirApp();

    const resposta = await chamar(servidor, autenticarComo(TODAS), 'GET', '');
    const corpo = (await resposta.json()) as { data: { flag: string; publicado: boolean }[] };

    expect(corpo.data).toEqual([expect.objectContaining({ flag: 'usuario_criado', publicado: false })]);
  });

  it('sem emailTemplates:send, 403', async () => {
    servidor = await subirApp();

    const resposta = await chamar(servidor, autenticarComo(['emailTemplates:read']), 'POST', '/usuario_criado/envios', {
      ids: [],
    });

    expect(resposta.status).toBe(403);
  });
});
