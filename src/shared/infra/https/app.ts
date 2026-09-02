import http from 'http';
import https from 'https';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import 'reflect-metadata';
import '@shared/container';

import { apiConfig } from '@configs/apiConfig';
import { enforceJsonContentType } from '@shared/infra/https/middlewares/contentTypeMiddleware';
import errorMiddleware from '@shared/infra/https/middlewares/errorMiddleware';
import { logRouterMiddleware } from '@shared/infra/https/middlewares/logRouterMiddleware';
import { createRateLimiter } from '@shared/infra/https/rateLimiter';
import routes from '@shared/infra/https/routes/Router';

import type { ServerOptions } from 'https';

export interface IHttpsServerOptions extends ServerOptions {
  key: string;
  cert: string;
  ca?: string;
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export class AppServer {
  public readonly server: express.Application;
  public readonly httpServer: https.Server | http.Server;

  constructor(httpsServerOptions?: IHttpsServerOptions) {
    this.server = express();

    this.httpServer = httpsServerOptions
      ? https.createServer(httpsServerOptions, this.server)
      : http.createServer(this.server);

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // A maioria dos PaaS roda atrás de um proxy reverso que injeta
    // X-Forwarded-For. Sem isso o rate limit rejeita o header por não confiar
    // nele, e `req.ip` fica sempre o do proxy.
    this.server.set('trust proxy', 1);

    if (apiConfig.isRouterMonitoringEnabled) {
      this.server.use(logRouterMiddleware);
    }

    // CSP desligada: a API só serve JSON, e a política default quebraria uma
    // futura UI de documentação servida pelo próprio processo.
    this.server.use(helmet({ contentSecurityPolicy: false }));

    // Limite global brando; rota sensível declara o próprio, mais apertado.
    this.server.use(createRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, limit: 300 }));

    this.server.use(enforceJsonContentType);
    this.server.use(express.json({ limit: apiConfig.jsonLimit }));
    this.server.use(cors({ origin: apiConfig.corsOrigin, credentials: apiConfig.isProduction }));
  }

  private setupRoutes(): void {
    this.server.use('/api', routes);
  }

  private setupErrorHandling(): void {
    // O middleware de erro é sempre o último registrado.
    this.server.use(errorMiddleware);
  }
}
