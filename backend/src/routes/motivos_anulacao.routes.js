const express = require('express');
const router = express.Router();

const motivosAnulacaoController = require('../controllers/motivos_anulacao.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, motivosAnulacaoController.list);
router.get('/:id', authMiddleware, motivosAnulacaoController.getById);
router.post('/', authMiddleware, motivosAnulacaoController.create);
router.put('/:id', authMiddleware, motivosAnulacaoController.update);
router.delete('/:id', authMiddleware, motivosAnulacaoController.delete);

module.exports = router;
