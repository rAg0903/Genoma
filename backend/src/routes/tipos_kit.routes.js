const express = require('express');
const router = express.Router();

const tiposKitController = require('../controllers/tipos_kit.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, tiposKitController.list);
router.get('/:id', authMiddleware, tiposKitController.getById);
router.post('/', authMiddleware, tiposKitController.create);
router.put('/:id', authMiddleware, tiposKitController.update);
router.delete('/:id', authMiddleware, tiposKitController.delete);

module.exports = router;
