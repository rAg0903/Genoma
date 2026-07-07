const express = require('express');
const router = express.Router();

const utilizadoresController = require('../controllers/utilizadores.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireSelfOrAdminForUtilizador } = require('../middleware/authorization.middleware');
const {
  utilizadorValidator,
  utilizadorUpdateValidator,
  idValidator,
} = require('../middleware/validators');
const { validationMiddleware } = require('../middleware/error.middleware');

router.get('/', authMiddleware, requireAdmin, utilizadoresController.list);
router.get('/:id', authMiddleware, requireSelfOrAdminForUtilizador, idValidator, validationMiddleware, utilizadoresController.getById);
router.post('/', authMiddleware, requireAdmin, utilizadorValidator, validationMiddleware, utilizadoresController.create);
router.put('/:id', authMiddleware, requireSelfOrAdminForUtilizador, [idValidator, ...utilizadorUpdateValidator], validationMiddleware, utilizadoresController.update);
router.delete('/:id', authMiddleware, requireAdmin, idValidator, validationMiddleware, utilizadoresController.delete);

module.exports = router;
