import { logger } from '@core/utils/logger';
import path from 'path';
import { DataSource } from 'typeorm';

const log = logger.child({ prefix: 'database' });
const isProduction = process.env.NODE_ENV === 'production';

export let appDataSource: DataSource | null = null;

function createDataSource() {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: String(process.env.DB_PASS),
    database: process.env.DB_NAME ?? 'my_database',
    synchronize: !isProduction,
    logging: process.env.NODE_ENV === 'debug',
    entities: [path.join(__dirname, '../../modules/**/*.schema.{js,ts}')],
    migrations: [path.join(__dirname, './migrations/*.{js,ts}')],
  });
}

export async function connectDatabase(): Promise<void> {
  appDataSource = appDataSource ?? createDataSource();
  await appDataSource.initialize();
  log.notice('Banco de dados PostgreSQL conectado.');
}
