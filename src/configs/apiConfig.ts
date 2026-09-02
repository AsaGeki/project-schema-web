import { env } from '@configs/envConfig';

/**
 * `CORS` aceita lista separada por vírgula; `*` libera qualquer origem.
 */
function resolveCorsOrigin(): string | string[] {
  if (env.CORS === '*') return '*';
  return env.CORS.split(',').map(origin => origin.trim());
}

export const apiConfig = {
  port: env.PORT,
  url: env.URL,
  jsonLimit: env.JSON_LIMIT,
  corsOrigin: resolveCorsOrigin(),
  isRouterMonitoringEnabled: env.ENABLE_ROUTER_MONITORING,
  isProduction: env.NODE_ENV === 'prod',
};
