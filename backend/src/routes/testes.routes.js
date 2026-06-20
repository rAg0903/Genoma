const express = require('express');
const router = express.Router();

const testesController = require('../controllers/testes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/testes - Listar todos os testes
router.get('/', authMiddleware, testesController.list);

// GET /api/testes/:id - Obter um teste específico
router.get('/:id', authMiddleware, testesController.getById);

// POST /api/testes - Criar um novo teste
router.post('/', authMiddleware, testesController.create);

// PUT /api/testes/:id - Atualizar um teste
router.put('/:id', authMiddleware, testesController.update);

// DELETE /api/testes/:id - Deletar um teste
router.delete('/:id', authMiddleware, testesController.delete);

module.exports = router;
