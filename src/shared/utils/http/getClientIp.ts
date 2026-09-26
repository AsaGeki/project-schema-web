import type { Request } from 'express';

/**
 * IP de quem chamou, sem o prefixo de IPv4 mapeado em IPv6 (`::ffff:`). Sai de
 * `req.ip`, que já respeita o `trust proxy` do app; ler o `x-forwarded-for` na
 * mão entregaria o primeiro valor da lista, que é justamente o que o cliente
 * escreve.
 */
export function getClientIp(req: Request): string {
  const raw = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  return raw.replace('::ffff:', '');
}
