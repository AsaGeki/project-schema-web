import os from 'os';
import { monitorEventLoopDelay } from 'perf_hooks';

import mongoose from 'mongoose';
import { singleton } from 'tsyringe';

import { prisma } from '@configs/database/prismaClient';
import { env } from '@configs/envConfig';
import { formatDuration } from '@shared/utils/time/formatDuration';

/** Estado de uma dependência externa. `off` significa que ela não foi configurada. */
export type TDependencyStatus = 'up' | 'down' | 'off';

export interface IAppHealth {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  uptimeText: string;
  eventLoopLagMs: number;
  memoryUsedMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  dependencies: {
    postgres: TDependencyStatus;
    mongo: TDependencyStatus;
  };
}

// Teto para o percentual de memória. Em container, defina MEMORY_LIMIT_MB para
// o limite real — sem isso o percentual é sobre a RAM da máquina inteira e não
// diz nada acionável.
const MEMORY_LIMIT_MB = Number(process.env.MEMORY_LIMIT_MB) || Math.round(os.totalmem() / 1024 / 1024);

const BYTES_IN_MB = 1024 * 1024;
const NANOSECONDS_IN_MS = 1e6;

@singleton()
export default class HealthService {
  // Histograma contínuo do event loop; `mean` dividido por 1e6 dá o lag em ms.
  private readonly eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });

  constructor() {
    this.eventLoopDelay.enable();
  }

  public async snapshot(): Promise<IAppHealth> {
    // Só o Postgres exige ida ao banco; o estado do Mongo é lido da conexão.
    const postgres = await this.checkPostgres();
    const mongo = this.checkMongo();

    const uptimeSeconds = Math.floor(process.uptime());
    const memoryUsedMb = process.memoryUsage().rss / BYTES_IN_MB;
    // `mean` vem NaN até o histograma acumular amostras.
    const lagMs = this.eventLoopDelay.mean / NANOSECONDS_IN_MS;

    // Dependência configurada e fora do ar degrada a aplicação; desligada, não.
    const isDegraded = postgres === 'down' || mongo === 'down';

    return {
      status: isDegraded ? 'degraded' : 'ok',
      uptimeSeconds,
      uptimeText: formatDuration(uptimeSeconds),
      eventLoopLagMs: Number.isFinite(lagMs) ? Number(lagMs.toFixed(2)) : 0,
      memoryUsedMb: Number(memoryUsedMb.toFixed(1)),
      memoryLimitMb: MEMORY_LIMIT_MB,
      memoryPercent: Number(((memoryUsedMb / MEMORY_LIMIT_MB) * 100).toFixed(1)),
      dependencies: { postgres, mongo },
    };
  }

  /** Consulta trivial: confirma que o pool responde, não só que a URL existe. */
  private async checkPostgres(): Promise<TDependencyStatus> {
    if (!env.database.DATABASE_URL) return 'off';

    try {
      await prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private checkMongo(): TDependencyStatus {
    if (!env.database.MONGO_URL) return 'off';
    return mongoose.connection.readyState === mongoose.ConnectionStates.connected ? 'up' : 'down';
  }
}
