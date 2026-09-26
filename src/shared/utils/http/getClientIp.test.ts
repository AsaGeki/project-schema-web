import { describe, expect, it } from 'vitest';

import { getClientIp } from './getClientIp';

import type { Request } from 'express';

function requisicao(ip: string | undefined, remoteAddress?: string): Request {
  return { ip, socket: { remoteAddress } } as unknown as Request;
}

describe('getClientIp', () => {
  it('tira o prefixo de IPv4 mapeado em IPv6', () => {
    expect(getClientIp(requisicao('::ffff:10.0.0.7'))).toBe('10.0.0.7');
  });

  it('mantém IPv6 puro como veio', () => {
    expect(getClientIp(requisicao('::1'))).toBe('::1');
  });

  it('cai no endereço do socket quando o Express não resolveu req.ip', () => {
    expect(getClientIp(requisicao(undefined, '::ffff:192.168.0.2'))).toBe('192.168.0.2');
  });

  it('devolve "unknown" sem nenhuma das duas fontes', () => {
    expect(getClientIp(requisicao(undefined))).toBe('unknown');
  });
});
