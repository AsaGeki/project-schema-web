import http from 'http';
import https from 'https';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import 'reflect-metadata';
import '@shared/container';

import { corsConfig } from '@configs/corsConfig';
import { env } from '@configs/envConfig';
import { enforceJsonContentType } from '@shared/infra/https/middlewares/contentTypeMiddleware';
import errorMiddleware from '@shared/infra/https/middlewares/errorMiddleware';
import { logRouterMiddleware } from '@shared/infra/https/middlewares/logRouterMiddleware';
import { createRateLimiter } from '@shared/infra/https/rateLimiter';
import routes from '@shared/infra/https/routes/router';

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
    // Quantos saltos do X-Forwarded-For são confiáveis. Tem que bater com o
    // número real de proxies na frente: a mais, o cliente escolhe o próprio IP
    // e engana o rate limit; a menos, `req.ip` vira o do proxy para todo mundo.
    // Zero vira `false`: é só com `false` que o express-rate-limit avisa no log
    // quando chega X-Forwarded-For sem proxy configurado.
    this.server.set('trust proxy', env.server.TRUST_PROXY || false);

    if (env.server.ENABLE_ROUTER_MONITORING) {
      this.server.use(logRouterMiddleware);
    }

    // CSP desligada: a API só serve JSON, e a política default quebraria uma
    // futura UI de documentação servida pelo próprio processo.
    this.server.use(helmet({ contentSecurityPolicy: false }));

    // Comprime com gzip/deflate conforme o Accept-Encoding; resposta abaixo de 1 KB sai crua.
    this.server.use(compression());

    // Limite global brando; rota sensível declara o próprio, mais apertado.
    this.server.use(createRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, limit: 300 }));

    this.server.use(enforceJsonContentType);
    // `verify` guarda o corpo bruto: a assinatura HMAC das integrações é
    // calculada sobre os bytes originais, que o JSON reserializado não reproduz.
    this.server.use(
      express.json({
        limit: env.server.JSON_LIMIT,
        verify: (req, _res, buffer) => {
          (req as express.Request).rawBody = buffer;
        },
      }),
    );
    this.server.use(cors(corsConfig));
  }

  private setupRoutes(): void {
    this.server.use('/api', routes);
  }

  private setupErrorHandling(): void {
    // O middleware de erro é sempre o último registrado.
    this.server.use(errorMiddleware);
  }
}
