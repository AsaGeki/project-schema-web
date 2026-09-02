import mongoose from 'mongoose';

import { env } from '@configs/envConfig';
import { logger } from '@shared/services/LoggerService';

const log = logger.child({ prefix: 'mongo' });

/**
 * Conecta ao Mongo quando `MONGO_URL` está definida. Um projeto que usa só
 * Prisma deixa a variável vazia e a conexão é ignorada.
 */
export async function connectMongo(): Promise<void> {
  if (!env.database.MONGO_URL) {
    log.debug('MONGO_URL vazia — conexão com o Mongo ignorada.');
    return;
  }

  await mongoose.connect(env.database.MONGO_URL);
  log.notice('Conectado ao MongoDB.');
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
  await mongoose.disconnect();
}
