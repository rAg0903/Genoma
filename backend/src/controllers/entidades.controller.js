const entidadesService = require('../services/entidades.service');

exports.list = async (req, res) => {
  try {
    const entidades = await entidadesService.listAll();
    res.json({ data: entidades, count: entidades.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const entidade = await entidadesService.getById(req.params.id);
    if (!entidade) return res.status(404).json({ error: 'Entidade não encontrada' });
    res.json({ data: entidade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const entidade = await entidadesService.create(req.body, req.user);
    res.status(201).json({ message: 'Entidade criada com sucesso', data: entidade });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const entidade = await entidadesService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Entidade atualizada com sucesso', data: entidade });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await entidadesService.delete(req.params.id, req.user);
    res.json({ message: 'Entidade eliminada com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
