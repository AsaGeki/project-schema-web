import crypto from 'crypto';

/** Assinatura HMAC-SHA256 do payload canônico, em hexadecimal. */
export function calculateHmac(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Compara assinaturas em tempo constante, para não vazar quantos caracteres
 * bateram através do tempo de resposta. Tamanhos diferentes já reprovam sem
 * chamar `timingSafeEqual`, que lançaria com buffers de tamanhos distintos.
 */
export function isSignatureValid(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
