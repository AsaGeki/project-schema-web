import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { injectable } from 'tsyringe';

import { env } from '@configs/envConfig';
import type IFileStorage from '@shared/infra/storage/IFileStorage';

/** Arquivos em `UPLOADS_DIR`. O nome no disco é gerado, nunca o do usuário. */
@injectable()
export default class LocalDiskStorage implements IFileStorage {
  private readonly raiz = path.resolve(env.uploads.UPLOADS_DIR);

  public async save(originPath: string, diretorio: string, extensao: string): Promise<string> {
    const key = path.posix.join(diretorio, `${randomUUID()}.${extensao}`);
    const destino = this.path(key);

    await fs.mkdir(path.dirname(destino), { recursive: true });
    // rename exige origem e destino no mesmo disco: o multer recebe dentro de UPLOADS_DIR por isso.
    await fs.rename(originPath, destino);

    return key;
  }

  public async remove(key: string): Promise<void> {
    await fs.rm(this.path(key), { force: true });
  }

  public path(key: string): string {
    return path.join(this.raiz, key);
  }
}
