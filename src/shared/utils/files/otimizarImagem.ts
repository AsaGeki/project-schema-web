import converterImagem from 'sharp';

import type { FormatEnum } from 'sharp';

/** Lado maior de uma imagem enviada. Foto de celular passa disso e não ganha nada em tela. */
const LADO_MAXIMO_IMAGEM = 2560;

/**
 * Regrava a imagem sem metadados (EXIF, GPS) e dentro de `LADO_MAXIMO_IMAGEM`, no
 * mesmo formato. Devolve o caminho do arquivo novo; o original continua onde estava.
 */
export async function otimizarImagem(caminho: string, extensao: string): Promise<string> {
  const destino = `${caminho}.otimizada`;
  const formato = (extensao === 'jpg' ? 'jpeg' : extensao) as keyof FormatEnum;

  // rotate() sem argumento aplica a orientação do EXIF antes de ele ser descartado.
  await converterImagem(caminho)
    .rotate()
    .resize({ width: LADO_MAXIMO_IMAGEM, height: LADO_MAXIMO_IMAGEM, fit: 'inside', withoutEnlargement: true })
    .toFormat(formato)
    .toFile(destino);

  return destino;
}
