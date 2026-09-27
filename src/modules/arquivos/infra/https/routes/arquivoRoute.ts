import { Router } from 'express';

import { EPermissaoArquivos } from '@modules/arquivos/EPermissaoArquivos';
import { MAXIMO_ARQUIVOS_POR_ENVIO } from '@modules/arquivos/formatosAceitos';
import ArquivosController from '@modules/arquivos/infra/https/controllers/ArquivosController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { upload } from '@shared/infra/https/upload';

const arquivoRoute = Router();
const controller = new ArquivosController();

arquivoRoute.use(verifyToken);

// authorize antes do upload: requisição sem permissão não chega a gravar arquivo.
arquivoRoute.post(
  '/',
  authorize(EPermissaoArquivos.CREATE),
  upload(MAXIMO_ARQUIVOS_POR_ENVIO).array('arquivos'),
  controller.create,
);
arquivoRoute.get('/:id/arquivo', authorize(EPermissaoArquivos.READ), controller.baixar);
arquivoRoute.delete('/:id', authorize(EPermissaoArquivos.DELETE), controller.delete);

export default arquivoRoute;
