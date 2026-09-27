import mongoose from 'mongoose';
import { vi } from 'vitest';

import type { AddressInfo } from 'net';

export interface IServidorDeTeste {
  url: string;
  fechar: () => Promise<void>;
}

/**
 * Sobe o `AppServer` numa porta livre com o ambiente informado. O `envConfig` é
 * lido no import, então cada cenário reimporta a aplicação; os models do
 * Mongoose saem antes porque o `mongoose` é compartilhado entre os imports.
 */
export async function subirApp(variaveis: Record<string, string> = {}): Promise<IServidorDeTeste> {
  vi.resetModules();
  mongoose.deleteModel(/.+/);
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);

  const { AppServer } = await import('@shared/infra/https/app.js');
  const { httpServer } = new AppServer();

  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    fechar: () => new Promise(resolve => httpServer.close(() => resolve())),
  };
}
