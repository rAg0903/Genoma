const express = require('express');
const router = express.Router();

const colheitasController = require('../controllers/colheitas.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Preview laboratório final (cascata de resolução)
router.get('/laboratorio-final/preview', authMiddleware, colheitasController.previewLaboratorioFinal);

// Calendario de agendamentos (contagem por dia + cor de carga)
router.get('/calendario', authMiddleware, colheitasController.calendario);

// Listagem de agendamentos/colheitas (filtros: from, to, posto_id)
router.get('/', authMiddleware, colheitasController.list);

// Agendar colheita (verifica stock + reserva kit + cria processo)
router.post('/', authMiddleware, colheitasController.create);

// Registar colheita efetiva (consome kit, processo -> Colheita Realizada)
router.post('/:id/registar', authMiddleware, colheitasController.registar);

// Cancelar agendamento (liberta kit, processo -> Cancelado)
router.delete('/:id', authMiddleware, colheitasController.cancel);

module.exports = router;
