import { logger } from '@core/utils/logger';
import '@infra/container';
import { connectDatabase } from '@infra/database/DataSource';
import { App } from '@infra/https/app';
import '@modules/users/container';
import 'dotenv/config';
import 'reflect-metadata';

const app = new App().server;
const PORT = process.env.PORT || 3333;
const log = logger.child({ prefix: 'server' });

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      log.notice(`Servidor rodando: http://localhost:${PORT}`);
    });

    const gracefulShutdown = (_signal: string) => {
      server.close(() => {
        log.notice('Servidor encerrado com sucesso.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    log.error('Falha crítica na inicialização.', { error });
    process.exit(1);
  }
}

bootstrap();
