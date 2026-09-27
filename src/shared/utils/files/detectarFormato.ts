/** Formato pelo conteúdo do arquivo, não pelo nome nem pelo `mimetype` que o cliente declara. */
export async function detectarFormato(caminho: string): Promise<{ ext: string; mime: string } | undefined> {
  // `file-type` só existe como ESM: import dinâmico funciona a partir de CommonJS, `require` não.
  const { fileTypeFromFile } = await import('file-type');

  return fileTypeFromFile(caminho);
}
