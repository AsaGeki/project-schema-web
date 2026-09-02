import { Router } from 'express';

import { userPartialSchema, userSchema } from '@modules/users/dtos/UserDTO';
import UsersController from '@modules/users/infra/https/controllers/UsersController';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateQuery, validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';
import { listQuerySchema } from '@shared/types/pagination';

const userRoute = Router();
const controller = new UsersController();

// `bind` mantém o método ligado à instância mesmo passado desreferenciado — sem
// ele, um controller que use `this` quebraria só em runtime.
// Cadastro é público; o restante exige token.
userRoute.post('/', validateSchema(userSchema), controller.create.bind(controller));

userRoute.use(verifyToken);

// Listagem é restrita a admin — a checagem é do FindAllService, não de middleware.
userRoute.get('/', validateQuery(listQuerySchema), controller.findAll.bind(controller));
userRoute.put('/:id', validateSchema(userPartialSchema), controller.update.bind(controller));
userRoute.delete('/:id', controller.delete.bind(controller));

export default userRoute;
