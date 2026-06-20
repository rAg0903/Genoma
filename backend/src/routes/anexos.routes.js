const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const anexosController = require('../controllers/anexos.controller');

router.get('/paciente/:pacienteId', authMiddleware, anexosController.listByPaciente);
router.get('/processo/:processoId', authMiddleware, anexosController.listByProcesso);
router.post('/', authMiddleware, anexosController.create);
router.delete('/:id', authMiddleware, anexosController.remove);

module.exports = router;
