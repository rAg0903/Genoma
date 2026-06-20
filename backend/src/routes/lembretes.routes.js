const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const lembretesController = require('../controllers/lembretes.controller');

router.get('/', authMiddleware, lembretesController.list);
router.get('/:id', authMiddleware, lembretesController.getById);
router.post('/', authMiddleware, lembretesController.create);
router.put('/:id', authMiddleware, lembretesController.update);
router.delete('/:id', authMiddleware, lembretesController.remove);

module.exports = router;
