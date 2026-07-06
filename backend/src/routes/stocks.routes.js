const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { requireStockSubmoduleAccess } = require('../middleware/authorization.middleware');
const stocksController = require('../controllers/stocks.controller');

router.get('/kits/:id/trace', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.getKitTrace);
router.post('/kits/:id/confirmar-lab', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.confirmLabArrival);
router.post('/kits/:id/reverter-descarte', authMiddleware, requireStockSubmoduleAccess('descartes'), stocksController.revertDescarteForKit);
router.get('/kits', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.getKits);
router.get('/kits/check-duplicado', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.checkKitDuplicado);
router.post('/kits', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.createKit);
router.put('/kits/:id', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.updateKit);
router.delete('/kits/:id', authMiddleware, requireStockSubmoduleAccess('kits'), stocksController.deleteKit);
router.get('/lotes', authMiddleware, requireStockSubmoduleAccess('lotes'), stocksController.getLotes);
router.post('/lotes', authMiddleware, requireStockSubmoduleAccess('lotes'), stocksController.createLote);
router.put('/lotes/:id', authMiddleware, requireStockSubmoduleAccess('lotes'), stocksController.updateLote);
router.get('/requisicoes', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.getRequisicoes);
router.post('/requisicoes', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.createRequisicao);
router.put('/requisicoes/:id', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.updateRequisicao);
router.delete('/requisicoes/:id', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.deleteRequisicao);

router.get('/descartes', authMiddleware, requireStockSubmoduleAccess('descartes'), stocksController.getRequisicoes);
router.post('/descartes', authMiddleware, requireStockSubmoduleAccess('descartes'), stocksController.createDescarte);
// Alias "Envios" (nomenclatura nova; "Requisição" fica reservado a pedidos de teste).
router.get('/envios', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.getRequisicoes);
router.post('/envios', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.createRequisicao);
router.put('/envios/:id', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.updateRequisicao);
router.delete('/envios/:id', authMiddleware, requireStockSubmoduleAccess('requisicoes'), stocksController.deleteRequisicao);
// O módulo "Movimentos" foi removido da UI. O registo de movimentos de kits
// (movimentos_kits) mantém-se como log interno de auditoria, alimentado
// pelos fluxos de colheita e envios.
router.get('/auditoria', authMiddleware, requireStockSubmoduleAccess('auditoria'), stocksController.getAuditoria);

module.exports = router;
