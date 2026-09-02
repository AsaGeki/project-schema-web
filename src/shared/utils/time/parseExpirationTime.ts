export type TExpirationUnit = 'seconds' | 'milliseconds';

const MULTIPLIERS: Record<string, Record<TExpirationUnit, number>> = {
  s: { seconds: 1, milliseconds: 1000 },
  m: { seconds: 60, milliseconds: 60_000 },
  h: { seconds: 3600, milliseconds: 3_600_000 },
  d: { seconds: 86_400, milliseconds: 86_400_000 },
};

/**
 * Converte uma duração no formato `'10s'`, `'5m'`, `'2h'`, `'1d'` para número.
 * É o que traduz as variáveis de expiração de token, escritas de forma legível
 * no ambiente, para o valor que as bibliotecas esperam.
 *
 * Número já convertido passa direto. Formato inválido lança, e lançar é o
 * comportamento pretendido: expiração errada em token é falha de configuração,
 * não caso a contornar.
 */
export function parseExpirationTime(expiration: string | number, unit: TExpirationUnit = 'seconds'): number {
  if (typeof expiration === 'number') return Math.floor(expiration);

  const match = /^(\d+)([smhd])$/.exec(expiration.trim());

  if (!match) {
    throw new Error(`Duração inválida: "${expiration}". Use um formato como "10s", "5m", "2h" ou "1d".`);
  }

  const value = Number(match[1]);
  const multiplier = MULTIPLIERS[match[2] as string];

  if (!multiplier) {
    throw new Error(`Unidade de tempo inválida em "${expiration}".`);
  }

  return value * multiplier[unit];
}
