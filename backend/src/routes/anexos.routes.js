const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadAnexo } = require('../middleware/anexos-upload.middleware');
const anexosController = require('../controllers/anexos.controller');

router.get('/paciente/:pacienteId', authMiddleware, anexosController.listByPaciente);
router.get('/processo/:processoId', authMiddleware, anexosController.listByProcesso);
router.get('/files/:id', authMiddleware, anexosController.downloadFile);
router.post('/upload', authMiddleware, (req, res, next) => {
  uploadAnexo(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Falha ao carregar ficheiro.' });
    next();
  });
}, anexosController.upload);
router.post('/', authMiddleware, anexosController.create);
router.delete('/:id', authMiddleware, anexosController.remove);

module.exports = router;
