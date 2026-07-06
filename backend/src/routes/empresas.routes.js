const express = require('express');
const router = express.Router();

const empresasController = require('../controllers/empresas.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');
const { empresaValidator, empresaUpdateValidator, idValidator } = require('../middleware/validators');
const { validationMiddleware } = require('../middleware/error.middleware');

router.get('/', authMiddleware, empresasController.list);
router.get('/:id', authMiddleware, idValidator, validationMiddleware, empresasController.getById);
router.post('/', authMiddleware, requireAdmin, empresaValidator, validationMiddleware, empresasController.create);
router.put('/:id', authMiddleware, requireAdmin, [idValidator, ...empresaUpdateValidator], validationMiddleware, empresasController.update);
router.delete('/:id', authMiddleware, requireAdmin, idValidator, validationMiddleware, empresasController.delete);

module.exports = router;
