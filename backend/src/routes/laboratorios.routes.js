const express = require('express');
const router = express.Router();

const laboratoriosController = require('../controllers/laboratorios.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, laboratoriosController.list);
router.get('/:id', authMiddleware, laboratoriosController.getById);
router.post('/', authMiddleware, laboratoriosController.create);
router.put('/:id', authMiddleware, laboratoriosController.update);
router.delete('/:id', authMiddleware, laboratoriosController.delete);

module.exports = router;
