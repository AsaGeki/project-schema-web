import os from 'os';
import { monitorEventLoopDelay } from 'perf_hooks';

import mongoose from 'mongoose';
import { singleton } from 'tsyringe';

import { prisma } from '@configs/database/prismaClient';
import { env } from '@configs/envConfig';
import { formatDuration } from '@shared/utils/time/formatDuration';

/** Estado de uma dependência externa. `OFF` significa que ela não foi configurada. */
export enum EDependencyStatus {
  UP = 'up',
  DOWN = 'down',
  OFF = 'off',
}

export enum EHealthStatus {
  OK = 'ok',
  DEGRADED = 'degraded',
}

export interface IAppHealth {
  status: EHealthStatus;
  uptimeSeconds: number;
  uptimeText: string;
  eventLoopLagMs: number;
  memoryUsedMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  dependencies: {
    postgres: EDependencyStatus;
    mongo: EDependencyStatus;
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
    const isDegraded = postgres === EDependencyStatus.DOWN || mongo === EDependencyStatus.DOWN;

    return {
      status: isDegraded ? EHealthStatus.DEGRADED : EHealthStatus.OK,
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
  private async checkPostgres(): Promise<EDependencyStatus> {
    if (!env.database.DATABASE_URL) return EDependencyStatus.OFF;

    try {
      await prisma.$queryRaw`SELECT 1`;
      return EDependencyStatus.UP;
    } catch {
      return EDependencyStatus.DOWN;
    }
  }

  private checkMongo(): EDependencyStatus {
    if (!env.database.MONGODB_URI) return EDependencyStatus.OFF;
    return mongoose.connection.readyState === mongoose.ConnectionStates.connected
      ? EDependencyStatus.UP
      : EDependencyStatus.DOWN;
  }
}
