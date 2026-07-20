const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');
const configuracaoSistemaController = require('../controllers/configuracao-sistema.controller');

router.get('/sistema', authMiddleware, configuracaoSistemaController.get);
router.put('/sistema', authMiddleware, requireAdmin, configuracaoSistemaController.save);

module.exports = router;
