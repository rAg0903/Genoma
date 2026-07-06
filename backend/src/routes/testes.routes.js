const express = require('express');
const router = express.Router();

const testesController = require('../controllers/testes.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');
const { testeValidator, testeUpdateValidator, idValidator } = require('../middleware/validators');
const { validationMiddleware } = require('../middleware/error.middleware');

router.get('/', authMiddleware, testesController.list);
router.get('/:id', authMiddleware, idValidator, validationMiddleware, testesController.getById);
router.post('/', authMiddleware, requireAdmin, testeValidator, validationMiddleware, testesController.create);
router.put('/:id', authMiddleware, requireAdmin, [idValidator, ...testeUpdateValidator], validationMiddleware, testesController.update);
router.delete('/:id', authMiddleware, requireAdmin, idValidator, validationMiddleware, testesController.delete);

module.exports = router;
