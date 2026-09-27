/** `*` libera tudo; fora isso, cada permissão exigida tem que estar na lista, idêntica. */
export function hasRequiredPermissions(abilities: readonly string[], exigidas: readonly string[]): boolean {
  if (abilities.includes('*')) return true;

  return exigidas.every(permissao => abilities.includes(permissao));
}
