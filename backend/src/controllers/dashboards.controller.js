const dashboardsService = require('../services/dashboards.service');

exports.operacional = async (req, res) => {
  try {
    const data = await dashboardsService.getOperacional();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.financeiro = async (req, res) => {
  try {
    const data = await dashboardsService.getFinanceiro();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.laboratorial = async (req, res) => {
  try {
    const data = await dashboardsService.getLaboratorial();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.executivo = async (req, res) => {
  try {
    const data = await dashboardsService.getExecutivo();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
