import { Router } from 'express';

import {
  alternarTemplateSchema,
  enviarEmailSchema,
  publicarTemplateSchema,
} from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EPermissaoEmailTemplates } from '@modules/emailTemplates/EPermissaoEmailTemplates';
import EmailTemplatesController from '@modules/emailTemplates/infra/https/controllers/EmailTemplatesController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';

const emailTemplateRoute = Router();
const controller = new EmailTemplatesController();

emailTemplateRoute.use(verifyToken);

emailTemplateRoute.get('/', authorize(EPermissaoEmailTemplates.READ), controller.findAll);
emailTemplateRoute.get('/:flag', authorize(EPermissaoEmailTemplates.READ), controller.findByFlag);
emailTemplateRoute.put(
  '/:flag',
  authorize(EPermissaoEmailTemplates.PUBLISH),
  validateSchema(publicarTemplateSchema),
  controller.publish,
);
emailTemplateRoute.patch(
  '/:flag/ativo',
  authorize(EPermissaoEmailTemplates.ACTIVATE),
  validateSchema(alternarTemplateSchema),
  controller.alternar,
);
emailTemplateRoute.post(
  '/:flag/envios',
  authorize(EPermissaoEmailTemplates.SEND),
  validateSchema(enviarEmailSchema),
  controller.send,
);

export default emailTemplateRoute;
