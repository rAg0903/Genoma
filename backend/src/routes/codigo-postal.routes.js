const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const codigoPostalController = require('../controllers/codigo-postal.controller.js');

router.get('/:cp', authMiddleware, codigoPostalController.lookup);

module.exports = router;
