const express = require('express');
const router = express.Router();

const pacientesController = require('../controllers/pacientes.controller.js');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');
const { pacienteValidator, pacienteUpdateValidator, idValidator } = require('../middleware/validators');
const { validationMiddleware } = require('../middleware/error.middleware');

router.get('/', authMiddleware, pacientesController.list);
router.get('/search', authMiddleware, pacientesController.search);
router.get('/:id', authMiddleware, idValidator, validationMiddleware, pacientesController.getById);
router.post('/', authMiddleware, pacienteValidator, validationMiddleware, pacientesController.create);
router.put('/:id', authMiddleware, [idValidator, ...pacienteUpdateValidator], validationMiddleware, pacientesController.update);
router.delete('/:id', authMiddleware, requireAdmin, idValidator, validationMiddleware, pacientesController.delete);

module.exports = router;