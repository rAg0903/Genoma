const express = require('express');
const router = express.Router();

const traceController = require('../controllers/trace.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rastreabilidade agregada: /trace?tipo=lote|kit|processo|resultado&id=...
router.get('/', authMiddleware, traceController.getTrace);

module.exports = router;
