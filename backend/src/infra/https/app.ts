import { errorMiddleware } from '@core/middlewares/errorMiddleware';
import { logMiddleware } from '@core/middlewares/logMiddleware';
import routes from '@infra/https/routes/routes';
import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';

export class App {
  public server: express.Application;

  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.errorMiddleware();
  }

  private middlewares(): void {
    this.server.use(helmet());
    this.server.use(express.json());
    this.server.use(
      cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' })
    );
    this.server.use(logMiddleware);
  }

  private routes(): void {
    this.server.use('/api', routes);
    this.server.get('/', (_req, res) =>
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    );
  }

  private errorMiddleware(): void {
    this.server.use(errorMiddleware);
  }
}
