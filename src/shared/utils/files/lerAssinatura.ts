import { createHash } from 'crypto';
import fs from 'fs/promises';

/** Hash e tamanho do arquivo como ele vai ser gravado, numa leitura só. */
export async function lerAssinatura(caminho: string): Promise<{ hashSha256: string; tamanhoBytes: number }> {
  const conteudo = await fs.readFile(caminho);

  return { hashSha256: createHash('sha256').update(conteudo).digest('hex'), tamanhoBytes: conteudo.length };
}
