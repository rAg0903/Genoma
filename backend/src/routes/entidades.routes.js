const express = require('express');
const router = express.Router();

const entidadesController = require('../controllers/entidades.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, entidadesController.list);
router.get('/:id', authMiddleware, entidadesController.getById);
router.post('/', authMiddleware, entidadesController.create);
router.put('/:id', authMiddleware, entidadesController.update);
router.delete('/:id', authMiddleware, entidadesController.delete);

module.exports = router;
