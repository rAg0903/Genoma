const express = require('express');
const router = express.Router();

const itensController = require('../controllers/itens_pesquisa.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/itens - Listar todos os itens de pesquisa
router.get('/', authMiddleware, itensController.list);

// GET /api/itens/:id - Obter um item específico
router.get('/:id', authMiddleware, itensController.getById);

// POST /api/itens - Criar um novo item de pesquisa
router.post('/', authMiddleware, itensController.create);

// PUT /api/itens/:id - Atualizar um item de pesquisa
router.put('/:id', authMiddleware, itensController.update);

// DELETE /api/itens/:id - Deletar um item de pesquisa
router.delete('/:id', authMiddleware, itensController.delete);

module.exports = router;
