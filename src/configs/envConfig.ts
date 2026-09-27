import { z } from 'zod';

export enum ENodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum EMailProvider {
  SMTP = 'smtp',
  GRAPH = 'graph',
}

const BYTES_POR_UNIDADE = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 } as const;

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
  /** URL pública pela qual o navegador chega a este backend. HTTPS liga `Secure` e o prefixo `__Host-` nos cookies. */
  PUBLIC_URL: z.url({ error: 'PUBLIC_URL deve ser uma URL válida' }).default('http://localhost:3000'),
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
  /** Chave da cifra dos cookies de token. Trocá-la invalida todas as sessões em cookie. */
  TOKEN_COOKIE_ENCRYPTION_KEY: z.string().min(32, 'TOKEN_COOKIE_ENCRYPTION_KEY deve ter no mínimo 32 caracteres'),
  ACCESS_TOKEN_COOKIE_NAME: z.string().default('access_token'),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('refresh_token'),
  REFRESH_TOKEN_COOKIE_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60 * 1000),
  /** Origens aceitas como destino de retorno, separadas por vírgula. */
  ALLOWED_RETURN_ORIGINS: z.string().default(''),
  /** Valor do header `X-Requested-By` que o front manda em toda chamada que altera estado. Não é segredo. */
  CSRF_HEADER_VALUE: z.string().min(1).default('project-schema'),
  /** Chaves de integração server-to-server, no formato `id:segredo,id2:segredo2`. */
  API_KEYS_HMAC: z.string().default(''),
  /** Janela de tolerância do timestamp assinado, em milissegundos. */
  API_KEYS_HMAC_TOLERANCIA_MS: z.coerce.number().default(5 * 60 * 1000),
  /** Raiz dos arquivos enviados. Em produção, pasta fora do projeto, para o deploy não apagar os arquivos. */
  UPLOADS_DIR: z.string().default('./uploads'),
  /** Tamanho máximo de cada arquivo enviado (`50MB`, `512KB`, `1GB`); sai daqui em bytes. */
  MAX_FILE_SIZE: z
    .string()
    .regex(/^\d+(\.\d+)?(B|KB|MB|GB)$/, 'MAX_FILE_SIZE deve ser um tamanho como 50MB, 512KB ou 1GB.')
    .default('50MB')
    .transform(texto => {
      const unidade = texto.replace(/^[\d.]+/, '') as keyof typeof BYTES_POR_UNIDADE;
      return Math.floor(parseFloat(texto) * BYTES_POR_UNIDADE[unidade]);
    }),
  /** Provedor de envio de e-mail. */
  MAIL_PROVIDER: z.enum(EMailProvider).default(EMailProvider.SMTP),
  /** Vazio fora de produção: o envio usa uma conta de teste do Ethereal. */
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform(value => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM_NAME: z.string().default('Project Schema'),
  SMTP_FROM_EMAIL: z.string().default('no-reply@exemplo.com'),
  GRAPH_TENANT_ID: z.string().default(''),
  GRAPH_CLIENT_ID: z.string().default(''),
  GRAPH_CLIENT_SECRET: z.string().default(''),
  /** Caixa que envia pelo Graph (`POST /users/{GRAPH_SENDER}/sendMail`). */
  GRAPH_SENDER: z.string().default(''),
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
    PUBLIC_URL: raw.PUBLIC_URL,
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
  uploads: {
    UPLOADS_DIR: raw.UPLOADS_DIR,
    MAX_FILE_SIZE_BYTES: raw.MAX_FILE_SIZE,
  },
  mail: {
    MAIL_PROVIDER: raw.MAIL_PROVIDER,
    SMTP_HOST: raw.SMTP_HOST,
    SMTP_PORT: raw.SMTP_PORT,
    SMTP_SECURE: raw.SMTP_SECURE,
    SMTP_USER: raw.SMTP_USER,
    SMTP_PASSWORD: raw.SMTP_PASSWORD,
    SMTP_FROM_NAME: raw.SMTP_FROM_NAME,
    SMTP_FROM_EMAIL: raw.SMTP_FROM_EMAIL,
    GRAPH_TENANT_ID: raw.GRAPH_TENANT_ID,
    GRAPH_CLIENT_ID: raw.GRAPH_CLIENT_ID,
    GRAPH_CLIENT_SECRET: raw.GRAPH_CLIENT_SECRET,
    GRAPH_SENDER: raw.GRAPH_SENDER,
  },
  auth: {
    JWT_SECRET: raw.JWT_SECRET,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: raw.JWT_REFRESH_EXPIRES_IN,
    TOKEN_COOKIE_ENCRYPTION_KEY: raw.TOKEN_COOKIE_ENCRYPTION_KEY,
    ACCESS_TOKEN_COOKIE_NAME: raw.ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME: raw.REFRESH_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_TTL_MS: raw.REFRESH_TOKEN_COOKIE_TTL_MS,
    ALLOWED_RETURN_ORIGINS: raw.ALLOWED_RETURN_ORIGINS,
    CSRF_HEADER_VALUE: raw.CSRF_HEADER_VALUE,
  },
} as const;
