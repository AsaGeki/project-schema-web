/** Onde os arquivos enviados ficam guardados. O banco grava só a key devolvida por `save`. */
export default interface IFileStorage {
  /** Move o arquivo de `originPath` para `diretorio` e devolve a key relativa que o localiza. */
  save(originPath: string, diretorio: string, extensao: string): Promise<string>;
  remove(key: string): Promise<void>;
  /** Caminho absoluto do arquivo, para servir ou empacotar. */
  path(key: string): string;
}
