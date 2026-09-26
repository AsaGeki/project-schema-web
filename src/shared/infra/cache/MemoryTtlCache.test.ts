import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MemoryTtlCache from './MemoryTtlCache';

describe('MemoryTtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve o valor dentro do TTL padrão e nada depois dele', () => {
    const cache = new MemoryTtlCache<number>(1000);
    cache.set('a', 1);

    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe(1);

    vi.advanceTimersByTime(1);
    expect(cache.get('a')).toBeUndefined();
  });

  it('respeita o TTL informado no set em vez do padrão', () => {
    const cache = new MemoryTtlCache<string>(1000);
    cache.set('curto', 'x', 100);

    vi.advanceTimersByTime(100);
    expect(cache.get('curto')).toBeUndefined();
  });

  it('remove a chave no delete', () => {
    const cache = new MemoryTtlCache<number>(1000);
    cache.set('a', 1);
    cache.delete('a');

    expect(cache.get('a')).toBeUndefined();
  });

  it('chave desconhecida devolve undefined', () => {
    expect(new MemoryTtlCache<number>(1000).get('nunca')).toBeUndefined();
  });
});
