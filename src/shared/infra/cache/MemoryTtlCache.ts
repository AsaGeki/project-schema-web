interface ICacheEntry<TValue> {
  value: TValue;
  expiresAt: number;
}

/**
 * Cache em memória com expiração por chave. Não é distribuído — cada processo
 * tem o seu —, então serve para cache curto, onde perder tudo num restart não é
 * problema. A entrada vencida sai na leitura.
 */
export default class MemoryTtlCache<TValue> {
  private readonly store = new Map<string, ICacheEntry<TValue>>();

  constructor(private readonly defaultTtlMs: number) {}

  public get(key: string): TValue | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public set(key: string, value: TValue, ttlMs: number = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }
}
