const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');

/**
 * POST /api/auth/register
 * Apenas acessível a administradores autenticados.
 * Criação de utilizadores via UI deve usar POST /api/utilizadores.
 */
router.post('/register', authMiddleware, requireAdmin, authController.register);

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;