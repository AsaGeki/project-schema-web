import { Router } from 'express';
import UsersController from './users.controller';

const router = Router();
const controller = new UsersController();

/**
 * Rotas de usuários
 * Usa .bind() para manter o contexto correto em cada rota
 * Padrão referência: universal/PADRAO-CRUD.md
 */

// GET /api/users - Listar todos (com paginação e busca)
router.get('/', controller.findAll.bind(controller));

// GET /api/users/:id - Buscar um por ID
router.get('/:id', controller.findOne.bind(controller));

// POST /api/users - Criar novo
router.post('/', controller.create.bind(controller));

// PATCH /api/users/:id - Atualizar
router.patch('/:id', controller.update.bind(controller));

// DELETE /api/users/:id - Deletar
router.delete('/:id', controller.delete.bind(controller));

export { router as usersRouter };
