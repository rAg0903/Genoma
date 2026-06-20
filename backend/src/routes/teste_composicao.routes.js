const express = require('express');
const router = express.Router();

const composicaoController = require('../controllers/teste_composicao.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/teste-composicao/teste/:testeId - Listar itens de um teste
router.get('/teste/:testeId', authMiddleware, composicaoController.listByTeste);

// GET /api/teste-composicao/item/:itemId - Listar testes de um item
router.get('/item/:itemId', authMiddleware, composicaoController.listByItem);

// POST /api/teste-composicao - Adicionar item a um teste
router.post('/', authMiddleware, composicaoController.addItem);

// DELETE /api/teste-composicao/:testeId/:itemId - Remover item de um teste
router.delete('/:testeId/:itemId', authMiddleware, composicaoController.removeItem);

module.exports = router;
