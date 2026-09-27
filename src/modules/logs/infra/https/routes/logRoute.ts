import { Router } from 'express';

import { logSchema } from '@modules/logs/dtos/LogDTO';
import { EPermissaoLogs } from '@modules/logs/EPermissaoLogs';
import LogsController from '@modules/logs/infra/https/controllers/LogsController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateQuery, validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';
import { listQuerySchema } from '@shared/types/pagination';

const logRoute = Router();
const controller = new LogsController();

logRoute.use(verifyToken);

// Log não tem update nem delete: registro de auditoria é imutável.
logRoute.post('/', validateSchema(logSchema), controller.create);

logRoute.get('/', authorize(EPermissaoLogs.READ), validateQuery(listQuerySchema), controller.findAll);

export default logRoute;
