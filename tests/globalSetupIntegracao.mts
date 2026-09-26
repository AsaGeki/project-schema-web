import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import path from 'path';

import mongoose from 'mongoose';

import { urlsDeTeste } from './ambienteDeTeste.mjs';

/**
 * Antes da suíte: zera o Postgres de teste e aplica o `schema.prisma` do zero.
 * `urlsDeTeste` falha antes daqui quando a URL não é de um banco `_test`.
 */
export function setup(): void {
  const { databaseUrl } = urlsDeTeste();
  const require = createRequire(import.meta.url);
  const prismaCli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build', 'index.js');

  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--force-reset', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

/** Depois da suíte: remove o banco Mongo de teste inteiro. */
export async function teardown(): Promise<void> {
  const { mongoUri } = urlsDeTeste();

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });

  try {
    await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }
}
