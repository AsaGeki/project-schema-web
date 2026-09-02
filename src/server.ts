import fs from 'fs';

import { apiConfig } from '@configs/apiConfig';
import { connectMongo, disconnectMongo } from '@configs/database/mongoClient';
import { env } from '@configs/envConfig';
import { AppServer } from '@shared/infra/https/app';
import type { IHttpsServerOptions } from '@shared/infra/https/app';
import { logger } from '@shared/services/LoggerService';

const log = logger.child({ prefix: 'server' });

/**
 * Monta as opções de HTTPS quando os três caminhos de certificado estão
 * preenchidos. Faltando qualquer um, o servidor sobe em HTTP.
 */
function resolveHttpsOptions(): IHttpsServerOptions | undefined {
  if (!env.HTTPS_KEY || !env.HTTPS_CERT) return undefined;

  return {
    key: fs.readFileSync(env.HTTPS_KEY, 'utf-8'),
    cert: fs.readFileSync(env.HTTPS_CERT, 'utf-8'),
    ...(env.HTTPS_CA ? { ca: fs.readFileSync(env.HTTPS_CA, 'utf-8') } : {}),
  };
}

async function start(): Promise<void> {
  await connectMongo();

  const httpsOptions = resolveHttpsOptions();
  const { httpServer } = new AppServer(httpsOptions);
  const protocol = httpsOptions ? 'https' : 'http';

  httpServer.listen(apiConfig.port, () => {
    log.notice(`Servidor no ar em ${protocol}://${apiConfig.url}:${apiConfig.port}/api`);
  });

  // Encerramento ordenado: para de aceitar conexões antes de fechar o Mongo.
  const shutdown = async (signal: string): Promise<void> => {
    log.notice(`${signal} recebido — encerrando.`);
    httpServer.close();
    await disconnectMongo();
    // eslint-disable-next-line n/no-process-exit -- encerramento por sinal: sair aqui é o comportamento pretendido.
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();
