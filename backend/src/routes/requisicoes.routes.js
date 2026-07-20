const express = require('express');
const router = express.Router();

const requisicoesController = require('../controllers/requisicoes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /api/requisicoes - App do medico submete requisicao de teste.
// Cria automaticamente o contacto (paciente) e abre o processo "Agendado".
router.post('/', authMiddleware, requisicoesController.create);

module.exports = router;
