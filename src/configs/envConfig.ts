import { z } from 'zod';

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

export const env: z.infer<typeof envSchema> = parsed.data;
