import path from 'path';

import multer from 'multer';

import { env } from '@configs/envConfig';

/**
 * Recebe multipart dentro de `UPLOADS_DIR/.recebendo`: o `IFileStorage` move com
 * `rename`, que exige origem e destino no mesmo disco. `defParamCharset` evita que
 * nome com acento chegue em latin1.
 */
export function upload(maximoArquivos: number): multer.Multer {
  return multer({
    dest: path.resolve(env.uploads.UPLOADS_DIR, '.recebendo'),
    defParamCharset: 'utf8',
    limits: { fileSize: env.uploads.MAX_FILE_SIZE_BYTES, files: maximoArquivos },
  });
}
