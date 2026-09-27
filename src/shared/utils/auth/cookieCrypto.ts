import crypto from 'crypto';

import { env } from '@configs/envConfig';

const ALGORITMO = 'aes-256-gcm';
const TAMANHO_IV = 12;

const chave = crypto.createHash('sha256').update(env.auth.TOKEN_COOKIE_ENCRYPTION_KEY).digest();

/**
 * Cifra o conteúdo do cookie de token. Não impede reapresentar o cookie
 * roubado; impede ler o JWT de dentro dele — quem está logado e até quando.
 */
export function cifrarValorCookie(valor: string): string {
  const iv = crypto.randomBytes(TAMANHO_IV);
  const cipher = crypto.createCipheriv(ALGORITMO, chave, iv);
  const cifrado = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()]);

  return [iv, cifrado, cipher.getAuthTag()].map(parte => parte.toString('base64url')).join('.');
}

/**
 * `undefined` em vez de lançar: conteúdo adulterado e chave trocada caem no
 * mesmo lugar — a sessão não vale.
 */
export function decifrarValorCookie(valor: string): string | undefined {
  const partes = valor.split('.');
  if (partes.length !== 3) return undefined;

  const [iv, cifrado, authTag] = partes.map(parte => Buffer.from(parte, 'base64url')) as [Buffer, Buffer, Buffer];

  try {
    const decipher = crypto.createDecipheriv(ALGORITMO, chave, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
  } catch {
    return undefined;
  }
}
