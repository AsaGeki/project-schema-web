const inFlight = new Map<string, Promise<unknown>>();

/**
 * Deduplica chamadas concorrentes com a mesma chave: se já existe uma `fn` em
 * andamento para `key`, devolve a mesma Promise em vez de disparar outra. Evita
 * a rajada de chamadas idênticas — várias requisições com token vencido
 * renovando juntas, vários logins simultâneos numa API externa. A chave é
 * liberada ao terminar, com sucesso ou falha.
 */
export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
