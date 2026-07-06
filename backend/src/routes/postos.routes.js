const express = require('express');
const router = express.Router();

const postosController = require('../controllers/postos.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');

router.get('/', authMiddleware, postosController.list);
router.get('/:id', authMiddleware, postosController.getById);
router.get('/:id/stock', authMiddleware, postosController.getStock);
router.get('/:id/kits-disponiveis', authMiddleware, postosController.getKitsDisponiveis);
router.post('/kits/:kitId/utilizar', authMiddleware, postosController.usarKit);
router.post('/', authMiddleware, requireAdmin, postosController.create);
router.put('/:id', authMiddleware, requireAdmin, postosController.update);
router.delete('/:id', authMiddleware, requireAdmin, postosController.delete);

module.exports = router;
