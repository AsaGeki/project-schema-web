/* eslint-disable @typescript-eslint/naming-convention -- augmentation do Express: o nome da interface é imposto pelo namespace. */

declare namespace Express {
  interface Request {
    /**
     * Usuário autenticado, populado pelo `verifyToken` a partir do access token.
     * Toda rota protegida pode ler `req.user` sem checagem adicional.
     */
    user: {
      id: string;
      isAdmin: boolean;
    };

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
