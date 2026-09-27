import { Router } from 'express';

import { perfilPartialSchema, perfilSchema } from '@modules/permissoes/dtos/PerfilDTO';
import { EPermissaoPerfis } from '@modules/permissoes/EPermissaoPerfis';
import PerfisController from '@modules/permissoes/infra/https/controllers/PerfisController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateQuery, validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';
import { listQuerySchema } from '@shared/types/pagination';

const perfilRoute = Router();
const controller = new PerfisController();

perfilRoute.use(verifyToken);

perfilRoute.post('/', authorize(EPermissaoPerfis.CREATE), validateSchema(perfilSchema), controller.create);
perfilRoute.get('/', authorize(EPermissaoPerfis.READ), validateQuery(listQuerySchema), controller.findAll);
perfilRoute.get('/:id', authorize(EPermissaoPerfis.READ), controller.findById);
perfilRoute.put('/:id', authorize(EPermissaoPerfis.UPDATE), validateSchema(perfilPartialSchema), controller.update);
perfilRoute.delete('/:id', authorize(EPermissaoPerfis.DELETE), controller.delete);

export default perfilRoute;
