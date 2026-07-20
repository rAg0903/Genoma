const express = require('express');
const router = express.Router();

const listagensController = require('../controllers/listagens.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Pesquisa global multi-entidade: /listagens/search?q=
router.get('/search', authMiddleware, listagensController.search);

// Exportacao (csv|xlsx|pdf): /listagens/export/:listing?format=csv&<filtros>
router.get('/export/:listing', authMiddleware, listagensController.export);

// Listagem paginada/filtrada/ordenada: /listagens/:listing?q=&estado=&page=&limit=&sort=&dir=
router.get('/:listing', authMiddleware, listagensController.list);

module.exports = router;
