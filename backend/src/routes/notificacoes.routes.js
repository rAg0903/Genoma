const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const notificacoesController = require('../controllers/notificacoes.controller');

router.get('/', authMiddleware, notificacoesController.list);
router.post('/marcar-todas-lidas', authMiddleware, notificacoesController.markAllRead);
router.post('/:id/lida', authMiddleware, notificacoesController.markRead);

module.exports = router;
