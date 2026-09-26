import { Router } from 'express';

import logRoute from '@modules/logs/infra/https/routes/logRoute';
import userRoute from '@modules/users/infra/https/routes/userRoute';
import appRoute from '@shared/infra/https/routes/appRoute';

/**
 * Barrel global das rotas: agrega o `Route` de cada módulo sob o prefixo do
 * recurso. É o único lugar que conhece todos os módulos HTTP.
 */
const routes = Router();

routes.use('/', appRoute);
routes.use('/users', userRoute);
routes.use('/logs', logRoute);

export default routes;
