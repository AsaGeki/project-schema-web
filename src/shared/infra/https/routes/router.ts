import { Router } from 'express';

import arquivoRoute from '@modules/arquivos/infra/https/routes/arquivoRoute';
import logRoute from '@modules/logs/infra/https/routes/logRoute';
import perfilRoute from '@modules/permissoes/infra/https/routes/perfilRoute';
import permissaoRoute from '@modules/permissoes/infra/https/routes/permissaoRoute';
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
routes.use('/perfis', perfilRoute);
routes.use('/permissoes', permissaoRoute);
routes.use('/arquivos', arquivoRoute);

export default routes;
