const lembretesService = require('../services/lembretes.service');

exports.list = async (req, res) => {
  try {
    const data = await lembretesService.listAll({ estado: req.query.estado });
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const lembrete = await lembretesService.getById(req.params.id);
    if (!lembrete) return res.status(404).json({ error: 'Lembrete não encontrado' });
    res.json({ data: lembrete });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const lembrete = await lembretesService.create(req.body, req.user);
    res.status(201).json({ message: 'Lembrete criado com sucesso', data: lembrete });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const lembrete = await lembretesService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Lembrete atualizado com sucesso', data: lembrete });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await lembretesService.delete(req.params.id, req.user);
    res.json({ message: 'Lembrete removido com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
