/**
 * Porta pela qual o `verifyToken` descobre as permissões de quem chamou. A
 * implementação fica no módulo `permissoes`, registrada com o token `ResolvedorDePermissoes`.
 */
export default interface IResolvedorDePermissoes {
  /** Permissões do usuário, `['*']` para acesso total, ou `null` quando ele não existe mais. */
  execute(userId: string): Promise<string[] | null>;
}
