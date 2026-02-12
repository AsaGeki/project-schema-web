import logger from '@config/logger';
import '@shared/container';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

// Segurança
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use(limiter);

// Body parser
app.use(express.json());

// HTTP Logger
import { httpLogger } from './middlewares/httpLogger';
app.use(httpLogger);

// Health check
app.get('/health', (_req, res) => {
  logger.debug('Health check requested');
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registre suas rotas aqui
// app.use('/api/users', userRoutes);

// 404
app.use((_req, res) => {
  return res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({
      err: error,
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: 'Erro interno do servidor',
      message:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
  logger.info(`📊 Health check disponível em http://localhost:${PORT}/health`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
