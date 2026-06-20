const express = require('express');
const router = express.Router();

const perfisController = require('../controllers/perfis.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireSelfOrAdminForPerfil } = require('../middleware/authorization.middleware');

// GET /api/perfis/:id/stocks-submodulos - Obter permissões granulares de Stocks
router.get('/:id/stocks-submodulos', authMiddleware, requireSelfOrAdminForPerfil, perfisController.getStockSubmodulos);

// PUT /api/perfis/:id/stocks-submodulos - Atualizar permissões granulares de Stocks
router.put('/:id/stocks-submodulos', authMiddleware, requireAdmin, perfisController.updateStockSubmodulos);

// GET /api/perfis - Listar todos os perfis
router.get('/', authMiddleware, perfisController.list);

// GET /api/perfis/:id - Obter um perfil específico
router.get('/:id', authMiddleware, perfisController.getById);

// POST /api/perfis - Criar um novo perfil
router.post('/', authMiddleware, requireAdmin, perfisController.create);

// PUT /api/perfis/:id - Atualizar um perfil
router.put('/:id', authMiddleware, requireAdmin, perfisController.update);

// DELETE /api/perfis/:id - Deletar um perfil
router.delete('/:id', authMiddleware, requireAdmin, perfisController.delete);

module.exports = router;
