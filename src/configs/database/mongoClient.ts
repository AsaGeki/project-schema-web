import mongoose from 'mongoose';

import { env } from '@configs/envConfig';
import { logger } from '@shared/services/LoggerService';

const log = logger.child({ prefix: 'mongo' });

/**
 * Conecta ao Mongo quando a URI do ambiente está definida (`MONGODB_URI` em
 * produção, `MONGODB_URI_DEV` fora dela). Um projeto que usa só Prisma deixa a
 * variável vazia e a conexão é ignorada.
 */
export async function connectMongo(): Promise<void> {
  if (!env.database.MONGODB_URI) {
    log.debug('URI do Mongo vazia — conexão com o Mongo ignorada.');
    return;
  }

  await mongoose.connect(env.database.MONGODB_URI);
  log.notice('Conectado ao MongoDB.');
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
  await mongoose.disconnect();
}
