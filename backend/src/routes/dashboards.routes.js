const express = require('express');
const router = express.Router();

const dashboardsController = require('../controllers/dashboards.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/operacional', authMiddleware, dashboardsController.operacional);
router.get('/financeiro', authMiddleware, dashboardsController.financeiro);
router.get('/laboratorial', authMiddleware, dashboardsController.laboratorial);
router.get('/executivo', authMiddleware, dashboardsController.executivo);
router.get('/sla', authMiddleware, dashboardsController.sla);

module.exports = router;
