import { Router } from 'express';
import { UsersController } from '../controllers/UsersController';

const usersRouter = Router();
const controller = new UsersController();

usersRouter.get('/', controller.findAll.bind(controller));
usersRouter.get('/:id', controller.findOne.bind(controller));
usersRouter.post('/', controller.create.bind(controller));
usersRouter.patch('/:id', controller.update.bind(controller));
usersRouter.delete('/:id', controller.delete.bind(controller));

export { usersRouter };
