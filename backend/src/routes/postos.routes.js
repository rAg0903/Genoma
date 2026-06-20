const express = require('express');
const router = express.Router();

const postosController = require('../controllers/postos.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, postosController.list);
router.post('/kits/:kitId/utilizar', authMiddleware, postosController.usarKit);
router.get('/:id', authMiddleware, postosController.getById);
router.get('/:id/stock', authMiddleware, postosController.getStock);
router.get('/:id/kits-disponiveis', authMiddleware, postosController.getKitsDisponiveis);
router.post('/', authMiddleware, postosController.create);
router.put('/:id', authMiddleware, postosController.update);
router.delete('/:id', authMiddleware, postosController.delete);

module.exports = router;
