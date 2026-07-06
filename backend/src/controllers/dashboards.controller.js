const dashboardsService = require('../services/dashboards.service');
const { isMedicoUser } = require('../utils/medico-access');

const medicoScope = async (user) => {
  if (await isMedicoUser(user)) return user?.id || null;
  return null;
};

exports.operacional = async (req, res) => {
  try {
    const data = await dashboardsService.getOperacional(await medicoScope(req.user));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.financeiro = async (req, res) => {
  try {
    const data = await dashboardsService.getFinanceiro(await medicoScope(req.user));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.laboratorial = async (req, res) => {
  try {
    const data = await dashboardsService.getLaboratorial(await medicoScope(req.user));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.executivo = async (req, res) => {
  try {
    const data = await dashboardsService.getExecutivo(await medicoScope(req.user));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sla = async (req, res) => {
  try {
    const data = await dashboardsService.getSLA(await medicoScope(req.user));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
