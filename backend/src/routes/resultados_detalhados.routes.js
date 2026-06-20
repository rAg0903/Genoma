const express = require('express');
const router = express.Router();

const resultadosController = require('../controllers/resultados_detalhados.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/resultados - Listar todos os resultados
router.get('/', authMiddleware, resultadosController.list);

// GET /api/resultados/:id - Obter um resultado específico
router.get('/:id', authMiddleware, resultadosController.getById);

// GET /api/resultados/pedido/:pedidoId - Listar resultados de um pedido
router.get('/pedido/:pedidoId', authMiddleware, resultadosController.listByPedido);

// POST /api/resultados - Criar um novo resultado
router.post('/', authMiddleware, resultadosController.create);

// PUT /api/resultados/:id - Atualizar um resultado
router.put('/:id', authMiddleware, resultadosController.update);

// DELETE /api/resultados/:id - Deletar um resultado
router.delete('/:id', authMiddleware, resultadosController.delete);

module.exports = router;
