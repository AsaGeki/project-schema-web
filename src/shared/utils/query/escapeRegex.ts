/**
 * Neutraliza os metacaracteres de expressão regular de um termo vindo do
 * cliente. Sem isso, uma busca por `a.b` casa qualquer caractere no lugar do
 * ponto, e um termo com `(` quebra a query com erro de sintaxe.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
