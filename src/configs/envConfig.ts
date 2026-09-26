import { z } from 'zod';

export enum ENodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Fonte única de leitura de variáveis de ambiente. Nenhum outro arquivo acessa
 * `process.env` — quem precisa de configuração lê daqui, ou de um `*Config` que
 * derive daqui.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(ENodeEnv).default(ENodeEnv.DEVELOPMENT),
  PORT: z.coerce.number().default(3000),
  /** Host deste backend, sem protocolo nem porta. */
  SELF_HOST: z.string().default('localhost'),
  CORS: z.string().default('*'),
  JSON_LIMIT: z.string().default('2mb'),
  /** Quantos proxies reversos existem na frente da API; 0 ignora o `x-forwarded-for`. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  ENABLE_ROUTER_MONITORING: z
    .string()
    .default('false')
    .transform(value => value === 'true'),
  HTTPS_KEY: z.string().default(''),
  HTTPS_CERT: z.string().default(''),
  HTTPS_CA: z.string().default(''),
  /** Conexão do Postgres usada pelo Prisma. Vazio desliga a persistência relacional. */
  DATABASE_URL: z.string().default(''),
  /** Conexão do Mongo em produção. */
  MONGODB_URI: z.string().default(''),
  /** Conexão do Mongo fora de produção. */
  MONGODB_URI_DEV: z.string().default(''),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  /** Segredo do refresh token — deve ser diferente de JWT_SECRET. */
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('12h'),
  /** Chaves de integração server-to-server, no formato `id:segredo,id2:segredo2`. */
  API_KEYS_HMAC: z.string().default(''),
  /** Janela de tolerância do timestamp assinado, em milissegundos. */
  API_KEYS_HMAC_TOLERANCIA_MS: z.coerce.number().default(5 * 60 * 1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração de ambiente inválida:', z.treeifyError(parsed.error));
  // eslint-disable-next-line n/no-process-exit -- sem ambiente válido não há aplicação para subir.
  process.exit(1);
}

const raw = parsed.data;

export const isProduction = raw.NODE_ENV === ENodeEnv.PRODUCTION;

export const env = {
  server: {
    NODE_ENV: raw.NODE_ENV,
    PORT: raw.PORT,
    SELF_HOST: raw.SELF_HOST,
    CORS: raw.CORS,
    JSON_LIMIT: raw.JSON_LIMIT,
    TRUST_PROXY: raw.TRUST_PROXY,
    ENABLE_ROUTER_MONITORING: raw.ENABLE_ROUTER_MONITORING,
  },
  https: {
    KEY: raw.HTTPS_KEY,
    CERT: raw.HTTPS_CERT,
    CA: raw.HTTPS_CA,
  },
  database: {
    DATABASE_URL: raw.DATABASE_URL,
    // Resolvido aqui pelo NODE_ENV: quem consome lê um campo só. Vazio desliga o Mongo.
    MONGODB_URI: isProduction ? raw.MONGODB_URI : raw.MONGODB_URI_DEV,
  },
  apiKeys: {
    API_KEYS_HMAC: raw.API_KEYS_HMAC,
    TOLERANCIA_MS: raw.API_KEYS_HMAC_TOLERANCIA_MS,
  },
  auth: {
    JWT_SECRET: raw.JWT_SECRET,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: raw.JWT_REFRESH_EXPIRES_IN,
  },
} as const;
