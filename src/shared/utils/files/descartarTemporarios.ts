import fs from 'fs/promises';

export async function descartarTemporarios(caminhos: string[]): Promise<void> {
  await Promise.all(caminhos.map(caminho => fs.rm(caminho, { force: true })));
}
