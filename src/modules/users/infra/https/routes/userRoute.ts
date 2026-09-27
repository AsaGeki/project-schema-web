import { Router } from 'express';

import { userPartialSchema, userSchema } from '@modules/users/dtos/UserDTO';
import { EPermissaoUsers } from '@modules/users/EPermissaoUsers';
import UsersController from '@modules/users/infra/https/controllers/UsersController';
import { authorize } from '@shared/infra/https/middlewares/authorizeMiddleware';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateQuery, validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';
import { listQuerySchema } from '@shared/types/pagination';

const userRoute = Router();
const controller = new UsersController();

// Cadastro é público; o restante exige token.
userRoute.post('/', validateSchema(userSchema), controller.create);

userRoute.use(verifyToken);

userRoute.get('/', authorize(EPermissaoUsers.READ), validateQuery(listQuerySchema), controller.findAll);

// Editar e remover: o próprio usuário pode sempre; outro exige permissão, conferida no service.
userRoute.put('/:id', validateSchema(userPartialSchema), controller.update);
userRoute.delete('/:id', controller.delete);

export default userRoute;
