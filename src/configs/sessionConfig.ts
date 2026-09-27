import { env } from '@configs/envConfig';

export interface ISessionConfig {
  /** Origem pública em HTTPS: os cookies de token saem com `Secure`. */
  secure: boolean;
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  refreshTokenCookieTtlMs: number;
  allowedReturnOrigins: string[];
}

const secure = env.server.PUBLIC_URL.startsWith('https://');

/**
 * O prefixo `__Host-` faz o navegador recusar o cookie sem `Secure`, com
 * `Domain` ou com `Path` diferente de `/`. Só entra em origem HTTPS: sem
 * `Secure` o navegador descartaria o cookie.
 */
const prefixo = secure ? '__Host-' : '';

const sessionConfig: ISessionConfig = {
  secure,
  accessTokenCookieName: `${prefixo}${env.auth.ACCESS_TOKEN_COOKIE_NAME}`,
  refreshTokenCookieName: `${prefixo}${env.auth.REFRESH_TOKEN_COOKIE_NAME}`,
  refreshTokenCookieTtlMs: env.auth.REFRESH_TOKEN_COOKIE_TTL_MS,
  allowedReturnOrigins: env.auth.ALLOWED_RETURN_ORIGINS.split(',')
    .map(origem => origem.trim())
    .filter(Boolean),
};

export default sessionConfig;
