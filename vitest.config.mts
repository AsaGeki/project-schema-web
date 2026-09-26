import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

import { lerVariavel, SEGREDOS_DE_TESTE } from './tests/ambienteDeTeste.mjs';

// Espelha os `paths` do tsconfig.json.
const alias = {
  '@configs': fileURLToPath(new URL('./src/configs', import.meta.url)),
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
  '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.integration.test.ts'],
          // Bancos vazios: teste unitário nunca alcança um banco, nem com as URLs no ambiente do CI.
          env: { ...SEGREDOS_DE_TESTE, NODE_ENV: 'test', DATABASE_URL: '', MONGODB_URI_DEV: '' },
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
          globalSetup: ['./tests/globalSetupIntegracao.mts'],
          // Um arquivo por vez: o Mongoose tem uma conexão padrão só por processo.
          fileParallelism: false,
          env: {
            ...SEGREDOS_DE_TESTE,
            NODE_ENV: 'test',
            DATABASE_URL: lerVariavel('DATABASE_URL_TEST') ?? '',
            MONGODB_URI_DEV: lerVariavel('MONGODB_URI_TEST') ?? '',
          },
        },
      },
    ],
  },
});
