/** Quem fez a requisição, como o `verifyToken` deixa em `req.user`. */
export interface IUsuarioAutenticado {
  id: string;
  /** Permissões `grupo:acao` somadas dos perfis, ou `['*']` para acesso total. */
  abilities: string[];
}
