/* eslint-disable @typescript-eslint/naming-convention -- augmentation do Express: o nome da interface é imposto pelo namespace. */

/**
 * Usuário autenticado, populado pelo `verifyToken` a partir do access token.
 * Toda rota protegida pode ler `req.user` sem checagem adicional.
 */
declare namespace Express {
  interface Request {
    user: {
      id: string;
      isAdmin: boolean;
    };
  }
}
