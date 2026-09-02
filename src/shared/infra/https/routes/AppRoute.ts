import { Router } from 'express';
import { container } from 'tsyringe';

import { env } from '@configs/envConfig';
import { sendResponse } from '@shared/infra/https/sendResponse';
import HealthService from '@shared/services/HealthService';

import type { Request, Response } from 'express';

const appRoute = Router();

/** Identificação da API. É a resposta de quem só quer saber se o serviço existe. */
appRoute.get('/', (_req: Request, res: Response): Response => {
  return sendResponse(res, {
    success: true,
    status: 200,
    data: {
      name: process.env.npm_package_name ?? 'backend',
      version: process.env.npm_package_version ?? '0.0.0',
      environment: env.server.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Diagnóstico para orquestrador e monitoramento. Responde 503 quando uma
 * dependência configurada está fora — é o que faz um health check automatizado
 * reagir, em vez de sempre receber 200.
 */
appRoute.get('/health', async (_req: Request, res: Response): Promise<Response> => {
  const health = await container.resolve(HealthService).snapshot();

  return sendResponse(res, {
    success: health.status === 'ok',
    status: health.status === 'ok' ? 200 : 503,
    data: health,
  });
});

export default appRoute;
