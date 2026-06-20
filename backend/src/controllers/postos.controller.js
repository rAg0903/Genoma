const postosService = require('../services/postos.service');

exports.list = async (req, res) => {
  try {
    const laboratorioId = req.query.laboratorio_id || null;
    const postos = await postosService.listAll(laboratorioId);
    res.json({ data: postos, count: postos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const posto = await postosService.getById(req.params.id);
    if (!posto) return res.status(404).json({ error: 'Posto não encontrado' });
    res.json({ data: posto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const posto = await postosService.create(req.body, req.user);
    res.status(201).json({ message: 'Posto criado com sucesso', data: posto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const posto = await postosService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Posto atualizado com sucesso', data: posto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await postosService.delete(req.params.id, req.user);
    res.json({ message: 'Posto eliminado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStock = async (req, res) => {
  try {
    const testeId = req.query.teste_id || null;
    const stock = await postosService.getStockDisponivel(req.params.id, testeId);
    res.json({ data: stock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getKitsDisponiveis = async (req, res) => {
  try {
    const testeId = req.query.teste_id || null;
    const kits = await postosService.listKitsDisponiveis(req.params.id, testeId);
    res.json({ data: kits, count: kits.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.usarKit = async (req, res) => {
  try {
    await postosService.usarKit(req.params.kitId, req.user, req.body || {});
    res.json({ message: 'Kit marcado como utilizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
