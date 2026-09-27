/* eslint-disable @typescript-eslint/naming-convention -- augmentation do Express: o nome da interface é imposto pelo namespace. */

import type { IUsuarioAutenticado } from '@shared/types/auth';

declare global {
  namespace Express {
    interface Request {
      /**
       * Usuário autenticado, populado pelo `verifyToken` a partir do access token e
       * das permissões dos perfis. Toda rota protegida pode ler `req.user`.
       */
      user: IUsuarioAutenticado;

      /**
       * Corpo bruto da requisição, capturado no `express.json`. A assinatura HMAC
       * é calculada sobre ele: o JSON já parseado e reserializado não reproduz
       * byte a byte o que o cliente assinou.
       */
      rawBody?: Buffer;

      /** Identificador da chave de integração, populado pelo `verifyApiKey`. */
      apiKeyId?: string;
    }
  }
}
