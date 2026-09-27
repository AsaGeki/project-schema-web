/** Texto puro para o `text` do e-mail: tira as tags e junta os espaços. */
export function removerTagsHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
