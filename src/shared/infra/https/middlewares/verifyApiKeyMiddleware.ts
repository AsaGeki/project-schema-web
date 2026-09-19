import { apiKeysConfig } from '@configs/apiKeysConfig';
import { UnauthorizedError } from '@shared/errors/UniversalError';
import { buildSignaturePayload } from '@shared/utils/auth/buildSignaturePayload';
import { calculateHmac, isSignatureValid } from '@shared/utils/auth/calculateHmac';

import type { NextFunction, Request, Response } from 'express';

/**
 * Autenticação server-to-server por chave assinada. O cliente envia o id da
 * chave, um timestamp e a assinatura HMAC do payload canônico; o servidor
 * recalcula a assinatura com o segredo correspondente e compara.
 *
 * O timestamp entra na assinatura e é conferido contra uma janela de
 * tolerância: sem isso, uma requisição legítima capturada por terceiros
 * poderia ser reenviada indefinidamente.
 */
export function verifyApiKey(req: Request, _res: Response, next: NextFunction): void {
  const keyId = req.headers['x-api-key-id'];
  const timestamp = req.headers['x-api-timestamp'];
  const signature = req.headers['x-api-signature'];

  if (typeof keyId !== 'string' || typeof timestamp !== 'string' || typeof signature !== 'string') {
    throw new UnauthorizedError({
      message:
        'Credenciais de integração incompletas: x-api-key-id, x-api-timestamp e x-api-signature são obrigatórios.',
    });
  }

  const secret = apiKeysConfig.keys[keyId];

  if (!secret) {
    throw new UnauthorizedError({ message: 'Chave de integração desconhecida.' });
  }

  const timestampMs = Number(timestamp);

  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > apiKeysConfig.toleranceMs) {
    throw new UnauthorizedError({ message: 'Timestamp fora da janela de tolerância.' });
  }

  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : '';
  const payload = buildSignaturePayload(req.method, req.originalUrl, timestamp, rawBody);

  if (!isSignatureValid(signature, calculateHmac(secret, payload))) {
    throw new UnauthorizedError({ message: 'Assinatura inválida.' });
  }

  req.apiKeyId = keyId;
  next();
}
