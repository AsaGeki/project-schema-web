import { z } from 'zod';

/**
 * Fonte única de leitura de variáveis de ambiente. Nenhum outro arquivo acessa
 * `process.env` — quem precisa de configuração lê daqui, ou de um `*Config` que
 * derive daqui.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'debug']).default('dev'),
  PORT: z.coerce.number().default(3000),
  URL: z.string().default('localhost'),
  CORS: z.string().default('*'),
  JSON_LIMIT: z.string().default('2mb'),
  ENABLE_ROUTER_MONITORING: z
    .string()
    .default('false')
    .transform(value => value === 'true'),
  HTTPS_KEY: z.string().default(''),
  HTTPS_CERT: z.string().default(''),
  HTTPS_CA: z.string().default(''),
  /** Conexão do Postgres usada pelo Prisma. Vazio desliga a persistência relacional. */
  DATABASE_URL: z.string().default(''),
  /** Conexão do Mongo usada pelo Mongoose. Vazio desliga a persistência de documento. */
  MONGO_URL: z.string().default(''),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  /** Segredo do refresh token — deve ser diferente de JWT_SECRET. */
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('12h'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração de ambiente inválida:', z.treeifyError(parsed.error));
  // eslint-disable-next-line n/no-process-exit -- sem ambiente válido não há aplicação para subir.
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  server: {
    NODE_ENV: raw.NODE_ENV,
    PORT: raw.PORT,
    URL: raw.URL,
    CORS: raw.CORS,
    JSON_LIMIT: raw.JSON_LIMIT,
    ENABLE_ROUTER_MONITORING: raw.ENABLE_ROUTER_MONITORING,
  },
  https: {
    KEY: raw.HTTPS_KEY,
    CERT: raw.HTTPS_CERT,
    CA: raw.HTTPS_CA,
  },
  database: {
    DATABASE_URL: raw.DATABASE_URL,
    MONGO_URL: raw.MONGO_URL,
  },
  auth: {
    JWT_SECRET: raw.JWT_SECRET,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: raw.JWT_REFRESH_EXPIRES_IN,
  },
} as const;

export const isProduction = env.server.NODE_ENV === 'prod';
