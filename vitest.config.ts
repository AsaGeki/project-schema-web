import path from 'path';

import { defineConfig } from 'vitest/config';

import { lerVariavel, SEGREDOS_DE_TESTE } from './tests/ambienteDeTeste';

// Espelha os `paths` do tsconfig.json.
const alias = {
  '@configs': path.resolve(__dirname, 'src/configs'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@modules': path.resolve(__dirname, 'src/modules'),
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
          globalSetup: ['./tests/globalSetupIntegracao.ts'],
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
