const express = require('express');
const router = express.Router();

const processosController = require('../controllers/processos.controller');
const resultadosController = require('../controllers/resultados.controller');
const faturacaoController = require('../controllers/faturacao.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/authorization.middleware');

router.get('/', authMiddleware, processosController.list);
router.get('/paciente/:pacienteId', authMiddleware, processosController.listByPaciente);
router.get('/:id', authMiddleware, processosController.getById);
router.post('/', authMiddleware, processosController.create);
router.put('/:id', authMiddleware, processosController.update);
router.get('/:id/colheita', authMiddleware, processosController.getColheita);
router.put('/:id/colheita', authMiddleware, processosController.updateColheita);
router.delete('/:id', authMiddleware, requireAdmin, processosController.delete);

// Resultados (modelo "tudo OK por defeito") e validacao clinica
router.get('/:id/resultados', authMiddleware, resultadosController.getResultados);
router.post('/:id/resultados', authMiddleware, resultadosController.registarResultados);
router.post('/:id/validar', authMiddleware, resultadosController.validar);

// Relatorios (HTML -> PDF) e envio
router.get('/:id/relatorios', authMiddleware, resultadosController.listRelatorios);
router.post('/:id/relatorio', authMiddleware, resultadosController.gerarRelatorio);
router.get('/:id/relatorio/html', authMiddleware, resultadosController.getRelatorioHtml);
router.post('/:id/relatorio/enviar', authMiddleware, resultadosController.enviarRelatorio);

// Faturacao do processo (Fase 4)
router.get('/:id/faturacao', authMiddleware, faturacaoController.get);
router.post('/:id/faturacao', authMiddleware, faturacaoController.emitir);
router.post('/:id/faturacao/pagamento', authMiddleware, faturacaoController.registarPagamento);
router.get('/:id/fatura/pdf', authMiddleware, faturacaoController.downloadPdf);

module.exports = router;
