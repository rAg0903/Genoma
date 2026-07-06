const express = require('express');
const router = express.Router();

const medicosController = require('../controllers/medicos.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');

router.get('/', authMiddleware, medicosController.list);
router.get('/:utilizadorId', authMiddleware, medicosController.getById);
router.post('/', authMiddleware, requireAdmin, medicosController.create);
router.put('/:utilizadorId', authMiddleware, requireAdmin, medicosController.update);
router.delete('/:utilizadorId', authMiddleware, requireAdmin, medicosController.delete);

module.exports = router;
