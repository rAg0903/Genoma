const express = require('express');
const router = express.Router();

const medicosController = require('../controllers/medicos.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/medicos - Listar todos os médicos
router.get('/', authMiddleware, medicosController.list);

// GET /api/medicos/:utilizadorId - Obter um médico específico
router.get('/:utilizadorId', authMiddleware, medicosController.getById);

// POST /api/medicos - Criar um novo médico
router.post('/', authMiddleware, medicosController.create);

// PUT /api/medicos/:utilizadorId - Atualizar um médico
router.put('/:utilizadorId', authMiddleware, medicosController.update);

// DELETE /api/medicos/:utilizadorId - Remover um médico
router.delete('/:utilizadorId', authMiddleware, medicosController.delete);

module.exports = router;
