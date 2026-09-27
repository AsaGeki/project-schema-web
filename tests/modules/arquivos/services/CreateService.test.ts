import { beforeEach, describe, expect, it, vi } from 'vitest';

import type IArquivosRepository from '@modules/arquivos/repositories/IArquivosRepository';
import CreateService from '@modules/arquivos/services/CreateService';
import { BadRequestError, ConflictError, UnsupportedMediaTypeError } from '@shared/errors/UniversalError';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import { descartarTemporarios } from '@shared/utils/files/descartarTemporarios';
import { detectarFormato } from '@shared/utils/files/detectarFormato';
import { lerAssinatura } from '@shared/utils/files/lerAssinatura';
import { otimizarImagem } from '@shared/utils/files/otimizarImagem';

vi.mock('@shared/utils/files/detectarFormato', () => ({ detectarFormato: vi.fn() }));
vi.mock('@shared/utils/files/otimizarImagem', () => ({
  otimizarImagem: vi.fn((caminho: string) => Promise.resolve(`${caminho}.otimizada`)),
}));
vi.mock('@shared/utils/files/lerAssinatura', () => ({ lerAssinatura: vi.fn() }));
vi.mock('@shared/utils/files/descartarTemporarios', () => ({ descartarTemporarios: vi.fn(() => Promise.resolve()) }));

const PDF = { ext: 'pdf', mime: 'application/pdf' };
const PNG = { ext: 'png', mime: 'image/png' };

function recebido(nome: string): Express.Multer.File {
  return { originalname: nome, path: `/recebendo/${nome}` } as Express.Multer.File;
}

function montar(opcoes: { noBanco?: object; falhaNoInsert?: Error } = {}) {
  const repository = {
    findOne: vi.fn(() => Promise.resolve(opcoes.noBanco ?? null)),
    insertMany: vi.fn((registros: unknown[]) =>
      opcoes.falhaNoInsert ? Promise.reject(opcoes.falhaNoInsert) : Promise.resolve(registros),
    ),
    deleteMany: vi.fn(() => Promise.resolve()),
  };
  let gravados = 0;
  const storage = {
    save: vi.fn((_origem: string, diretorio: string, extensao: string) =>
      Promise.resolve(`${diretorio}/k${++gravados}.${extensao}`),
    ),
    remove: vi.fn(() => Promise.resolve()),
  };
  const service = new CreateService(repository as unknown as IArquivosRepository, storage as unknown as IFileStorage);
  return { service, repository, storage };
}

describe('CreateService (arquivos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detectarFormato).mockReset();
    vi.mocked(lerAssinatura).mockImplementation(caminho =>
      Promise.resolve({ hashSha256: `hash(${caminho})`, tamanhoBytes: 10 }),
    );
  });

  it('sem arquivo, 400 sem tocar no storage', async () => {
    const { service, storage, repository } = montar();

    await expect(service.execute(undefined, 'u-1')).rejects.toBeInstanceOf(BadRequestError);
    expect(storage.save).not.toHaveBeenCalled();
    expect(repository.deleteMany).not.toHaveBeenCalled();
  });

  it('formato não reconhecido ou fora da lista, 415, e o temporário é descartado', async () => {
    const { service, storage } = montar();
    vi.mocked(detectarFormato)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ ext: 'zip', mime: 'application/zip' });

    await expect(service.execute([recebido('a.png')], 'u-1')).rejects.toMatchObject({ code: 'FORMATO_NAO_ACEITO' });
    await expect(service.execute([recebido('b.zip')], 'u-1')).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
    expect(storage.save).not.toHaveBeenCalled();
    expect(descartarTemporarios).toHaveBeenCalledWith(['/recebendo/a.png']);
  });

  it('imagem é otimizada antes de gravar; PDF grava o original', async () => {
    const { service, storage, repository } = montar();
    vi.mocked(detectarFormato).mockResolvedValueOnce(PNG).mockResolvedValueOnce(PDF);

    const resposta = await service.execute([recebido('foto.png'), recebido('doc.pdf')], 'u-1');

    expect(otimizarImagem).toHaveBeenCalledOnce();
    expect(storage.save.mock.calls).toEqual([
      ['/recebendo/foto.png.otimizada', 'arquivos', 'png'],
      ['/recebendo/doc.pdf', 'arquivos', 'pdf'],
    ]);
    expect(repository.insertMany).toHaveBeenCalledWith([
      {
        nomeOriginal: 'foto.png',
        arquivo: 'arquivos/k1.png',
        mimeType: 'image/png',
        tamanhoBytes: 10,
        hashSha256: 'hash(/recebendo/foto.png.otimizada)',
        createdBy: 'u-1',
      },
      {
        nomeOriginal: 'doc.pdf',
        arquivo: 'arquivos/k2.pdf',
        mimeType: 'application/pdf',
        tamanhoBytes: 10,
        hashSha256: 'hash(/recebendo/doc.pdf)',
        createdBy: 'u-1',
      },
    ]);
    expect(descartarTemporarios).toHaveBeenCalledWith([
      '/recebendo/foto.png',
      '/recebendo/doc.pdf',
      '/recebendo/foto.png.otimizada',
    ]);
    expect(resposta).toMatchObject({ success: true, status: 201 });
  });

  it('imagem que o sharp não consegue ler, 422 sem gravar', async () => {
    const { service, storage } = montar();
    vi.mocked(detectarFormato).mockResolvedValue(PNG);
    vi.mocked(otimizarImagem).mockRejectedValueOnce(new Error('Input buffer contains unsupported image format'));

    await expect(service.execute([recebido('quebrada.png')], 'u-1')).rejects.toMatchObject({
      status: 422,
      code: 'IMAGEM_INVALIDA',
    });
    expect(storage.save).not.toHaveBeenCalled();
    expect(descartarTemporarios).toHaveBeenCalledWith(['/recebendo/quebrada.png']);
  });

  it('o mesmo conteúdo duas vezes no envio, 409, e o que já foi gravado sai', async () => {
    const { service, storage, repository } = montar();
    vi.mocked(detectarFormato).mockResolvedValue(PDF);
    vi.mocked(lerAssinatura).mockResolvedValue({ hashSha256: 'igual', tamanhoBytes: 10 });

    await expect(service.execute([recebido('a.pdf'), recebido('b.pdf')], 'u-1')).rejects.toMatchObject({
      code: 'ARQUIVO_REPETIDO',
    });
    expect(storage.remove).toHaveBeenCalledWith('arquivos/k1.pdf');
    expect(repository.deleteMany).toHaveBeenCalledWith({ arquivo: { $in: ['arquivos/k1.pdf'] } });
    expect(repository.insertMany).not.toHaveBeenCalled();
  });

  it('conteúdo que o usuário já enviou antes, 409 sem gravar', async () => {
    const { service, storage, repository } = montar({ noBanco: { _id: 'x' } });
    vi.mocked(detectarFormato).mockResolvedValue(PDF);

    await expect(service.execute([recebido('a.pdf')], 'u-1')).rejects.toBeInstanceOf(ConflictError);
    expect(repository.findOne).toHaveBeenCalledWith({ createdBy: 'u-1', hashSha256: 'hash(/recebendo/a.pdf)' });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('falha no insertMany desfaz os registros do lote e os arquivos movidos', async () => {
    const falha = new Error('E11000');
    const { service, storage, repository } = montar({ falhaNoInsert: falha });
    vi.mocked(detectarFormato).mockResolvedValue(PDF);

    await expect(service.execute([recebido('a.pdf'), recebido('b.pdf')], 'u-1')).rejects.toBe(falha);
    expect(repository.deleteMany).toHaveBeenCalledWith({ arquivo: { $in: ['arquivos/k1.pdf', 'arquivos/k2.pdf'] } });
    expect(storage.remove.mock.calls).toEqual([['arquivos/k1.pdf'], ['arquivos/k2.pdf']]);
  });
});
