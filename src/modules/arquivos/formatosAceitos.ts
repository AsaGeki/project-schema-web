/** Extensões do `file-type`, que olha o conteúdo do arquivo e não o que o cliente declara. */
export const EXTENSOES_ACEITAS: readonly string[] = ['pdf', 'jpg', 'png', 'webp', 'docx', 'xlsx'];

/** Passam pelo `otimizarImagem` antes de gravar: sai o EXIF (GPS do celular) e o tamanho cai. */
export const EXTENSOES_IMAGEM: readonly string[] = ['jpg', 'png', 'webp'];

/** Teto de arquivos por envio. */
export const MAXIMO_ARQUIVOS_POR_ENVIO = 20;
