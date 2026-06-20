const express = require('express');
const router = express.Router();

const pacientesController = require('../controllers/pacientes.controller.js');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/pacientes - Listar todos os pacientes
router.get('/', authMiddleware, pacientesController.list);

// GET /api/pacientes/search - Procurar pacientes por nome
router.get('/search', authMiddleware, pacientesController.search);

// GET /api/pacientes/:id - Obter um paciente específico
router.get('/:id', authMiddleware, pacientesController.getById);

// POST /api/pacientes - Criar um novo paciente
router.post('/', authMiddleware, pacientesController.create);

// PUT /api/pacientes/:id - Atualizar um paciente
router.put('/:id', authMiddleware, pacientesController.update);

// DELETE /api/pacientes/:id - Deletar um paciente
router.delete('/:id', authMiddleware, pacientesController.delete);

module.exports = router;