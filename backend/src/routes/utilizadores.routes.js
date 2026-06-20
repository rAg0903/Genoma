const express = require('express');
const router = express.Router();

const utilizadoresController = require('../controllers/utilizadores.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/utilizadores - Listar todos os utilizadores
router.get('/', authMiddleware, utilizadoresController.list);

// GET /api/utilizadores/:id - Obter um utilizador específico
router.get('/:id', authMiddleware, utilizadoresController.getById);

// POST /api/utilizadores - Criar um novo utilizador
router.post('/', authMiddleware, utilizadoresController.create);

// PUT /api/utilizadores/:id - Atualizar um utilizador
router.put('/:id', authMiddleware, utilizadoresController.update);

// DELETE /api/utilizadores/:id - Deletar um utilizador
router.delete('/:id', authMiddleware, utilizadoresController.delete);

module.exports = router;
