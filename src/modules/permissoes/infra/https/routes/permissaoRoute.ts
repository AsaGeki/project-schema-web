import { Router } from 'express';

import { EPermissaoPerfis } from '@modules/permissoes/EPermissaoPerfis';
import PermissoesController from '@modules/permissoes/infra/https/controllers/PermissoesController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';

const permissaoRoute = Router();
const controller = new PermissoesController();

permissaoRoute.use(verifyToken);

// Quem monta perfil precisa ver o catálogo; por isso a leitura de perfis basta.
permissaoRoute.get('/', authorize(EPermissaoPerfis.READ), controller.catalogo);

export default permissaoRoute;
