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
import { errorHandler } from './middlewares/errorHandler';
import { httpLogger } from './middlewares/httpLogger';
app.use(httpLogger);

// Health check
app.get('/health', (_req, res) => {
  logger.debug('Health check requested');
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrar rotas dos módulos
import { usersRouter } from '@modules/users';
app.use('/api/users', usersRouter);

// 404
app.use((_req, res) => {
  return res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
  logger.info(`📊 Health check disponível em http://localhost:${PORT}/health`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
