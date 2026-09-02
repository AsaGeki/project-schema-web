import { Router } from 'express';

import LogRoute from '@modules/logs/infra/https/routes/LogRoute';
import UserRoute from '@modules/users/infra/https/routes/UserRoute';

/**
 * Barrel global das rotas: agrega o `Route` de cada módulo sob o prefixo do
 * recurso. É o único lugar que conhece todos os módulos HTTP.
 */
const routes = Router();

routes.use('/users', UserRoute);
routes.use('/logs', LogRoute);

export default routes;
