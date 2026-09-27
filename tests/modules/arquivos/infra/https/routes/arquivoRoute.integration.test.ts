import fs from 'fs/promises';
import path from 'path';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import converterImagem from 'sharp';
import { container } from 'tsyringe';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { env } from '@configs/envConfig';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';

import { type IServidorDeTeste, subirApp } from '../../../../../subirApp';

interface IArquivoResposta {
  _id: string;
  nomeOriginal: string;
  mimeType: string;
  arquivo: string;
  url: string;
}

const raiz = path.resolve(env.uploads.UPLOADS_DIR);
const recebendo = path.join(raiz, '.recebendo');
const TODAS = ['arquivos:create', 'arquivos:read', 'arquivos:delete'];
const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

function autenticarComo(abilities: string[]): string {
  container.registerInstance<IResolvedorDePermissoes>('ResolvedorDePermissoes', {
    execute: () => Promise.resolve(abilities),
  });
  return `Bearer ${jwt.sign({ sub: 'u-1' }, env.auth.JWT_SECRET)}`;
}

async function png(): Promise<Buffer> {
  return converterImagem({ create: { width: 8, height: 8, channels: 3, background: '#0a0' } })
    .png()
    .toBuffer();
}

function enviar(
  servidor: IServidorDeTeste,
  token: string,
  arquivos: { conteudo: Buffer; nome: string; tipo?: string }[],
): Promise<Response> {
  const corpo = new FormData();
  for (const { conteudo, nome, tipo } of arquivos) {
    corpo.append('arquivos', new Blob([conteudo], { type: tipo ?? 'application/octet-stream' }), nome);
  }

  return fetch(`${servidor.url}/api/arquivos`, { method: 'POST', headers: { Authorization: token }, body: corpo });
}

async function pendentes(): Promise<string[]> {
  return fs.readdir(recebendo).catch(() => []);
}

describe('rotas de arquivos (Mongo e disco reais)', () => {
  let servidor: IServidorDeTeste | undefined;

  beforeAll(async () => {
    await connectMongo();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('arquivos').deleteMany({});
    await fs.rm(path.join(raiz, 'arquivos'), { recursive: true, force: true });
  });

  afterEach(async () => {
    await servidor?.fechar();
    servidor = undefined;
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await mongoose.connection.collection('arquivos').deleteMany({});
    await fs.rm(raiz, { recursive: true, force: true });
    await disconnectMongo();
  });

  it('sem permissão, 403 sem gravar nada em disco', async () => {
    servidor = await subirApp();

    const resposta = await enviar(servidor, autenticarComo([]), [{ conteudo: PDF, nome: 'a.pdf' }]);

    expect(resposta.status).toBe(403);
    expect(await pendentes()).toEqual([]);
  });

  it('envia, baixa e apaga, mantendo o nome com acento', async () => {
    servidor = await subirApp();
    const token = autenticarComo(TODAS);

    const envio = await enviar(servidor, token, [
      { conteudo: PDF, nome: 'relatório.pdf' },
      { conteudo: await png(), nome: 'foto.png' },
    ]);
    const {
      data: [pdf, imagem],
    } = (await envio.json()) as { data: [IArquivoResposta, IArquivoResposta] };

    expect(envio.status).toBe(201);
    expect([pdf.nomeOriginal, pdf.mimeType, imagem.mimeType]).toEqual([
      'relatório.pdf',
      'application/pdf',
      'image/png',
    ]);
    expect(await pendentes()).toEqual([]);

    const download = await fetch(`${servidor.url}${pdf.url}`, { headers: { Authorization: token } });
    expect(download.status).toBe(200);
    expect(download.headers.get('content-disposition')).toBe('attachment; filename="relatório.pdf"');
    expect(Buffer.from(await download.arrayBuffer())).toEqual(PDF);

    const remocao = await fetch(`${servidor.url}/api/arquivos/${pdf._id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    expect(remocao.status).toBe(204);
    await expect(fs.access(path.join(raiz, pdf.arquivo))).rejects.toThrow();
    expect((await fetch(`${servidor.url}${pdf.url}`, { headers: { Authorization: token } })).status).toBe(404);
  });

  it('texto com nome e tipo de imagem, 415 sem sobrar nada', async () => {
    servidor = await subirApp();

    const resposta = await enviar(servidor, autenticarComo(TODAS), [
      { conteudo: Buffer.from('só texto'), nome: 'foto.png', tipo: 'image/png' },
    ]);

    expect(resposta.status).toBe(415);
    expect(await resposta.json()).toMatchObject({ code: 'FORMATO_NAO_ACEITO' });
    expect(await pendentes()).toEqual([]);
    expect(await mongoose.connection.collection('arquivos').countDocuments()).toBe(0);
  });

  it('o mesmo arquivo de novo, 409, com um arquivo só no disco', async () => {
    servidor = await subirApp();
    const token = autenticarComo(TODAS);

    expect((await enviar(servidor, token, [{ conteudo: PDF, nome: 'a.pdf' }])).status).toBe(201);
    const repetido = await enviar(servidor, token, [{ conteudo: PDF, nome: 'b.pdf' }]);

    expect(repetido.status).toBe(409);
    expect(await repetido.json()).toMatchObject({ code: 'ARQUIVO_REPETIDO' });
    expect(await fs.readdir(path.join(raiz, 'arquivos'))).toHaveLength(1);
  });

  it('acima de MAX_FILE_SIZE, 413 sem temporário sobrando', async () => {
    servidor = await subirApp({ MAX_FILE_SIZE: '1KB' });

    const resposta = await enviar(servidor, autenticarComo(TODAS), [
      { conteudo: Buffer.alloc(4096, 1), nome: 'grande.pdf' },
    ]);

    expect(resposta.status).toBe(413);
    expect(await pendentes()).toEqual([]);
  });

  it('registro cujo arquivo sumiu do disco, download 404', async () => {
    servidor = await subirApp();
    const token = autenticarComo(TODAS);
    const {
      data: [pdf],
    } = (await (await enviar(servidor, token, [{ conteudo: PDF, nome: 'a.pdf' }])).json()) as {
      data: [IArquivoResposta];
    };

    await fs.rm(path.join(raiz, pdf.arquivo));

    expect((await fetch(`${servidor.url}${pdf.url}`, { headers: { Authorization: token } })).status).toBe(404);
  });
});
