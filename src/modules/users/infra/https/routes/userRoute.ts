import { Router } from 'express';

import { userPartialSchema, userSchema } from '@modules/users/dtos/UserDTO';
import UsersController from '@modules/users/infra/https/controllers/UsersController';
import { verifyToken } from '@shared/infra/https/middlewares/verifyTokenMiddleware';
import { validateQuery, validateSchema } from '@shared/infra/https/middlewares/zodSchemaMiddleware';
import { listQuerySchema } from '@shared/types/pagination';

const userRoute = Router();
const controller = new UsersController();

// Cadastro é público; o restante exige token.
userRoute.post('/', validateSchema(userSchema), controller.create);

userRoute.use(verifyToken);

// Listagem é restrita a admin — a checagem é do FindAllService, não de middleware.
userRoute.get('/', validateQuery(listQuerySchema), controller.findAll);
userRoute.put('/:id', validateSchema(userPartialSchema), controller.update);
userRoute.delete('/:id', controller.delete);

export default userRoute;
