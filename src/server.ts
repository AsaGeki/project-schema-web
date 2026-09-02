import fs from 'fs';

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
  if (!env.https.KEY || !env.https.CERT) return undefined;

  return {
    key: fs.readFileSync(env.https.KEY, 'utf-8'),
    cert: fs.readFileSync(env.https.CERT, 'utf-8'),
    ...(env.https.CA ? { ca: fs.readFileSync(env.https.CA, 'utf-8') } : {}),
  };
}

async function start(): Promise<void> {
  await connectMongo();

  const httpsOptions = resolveHttpsOptions();
  const { httpServer } = new AppServer(httpsOptions);
  const protocol = httpsOptions ? 'https' : 'http';

  httpServer.listen(env.server.PORT, () => {
    log.notice(`Servidor no ar em ${protocol}://${env.server.URL}:${env.server.PORT}/api`);
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
