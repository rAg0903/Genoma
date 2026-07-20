const tiposKitService = require('../services/tipos_kit.service');

exports.list = async (req, res) => {
  try {
    const data = await tiposKitService.listAll();
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await tiposKitService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Tipo de kit não encontrado' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await tiposKitService.create(req.body, req.user);
    res.status(201).json({ message: 'Tipo de kit criado com sucesso', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await tiposKitService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Tipo de kit atualizado com sucesso', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await tiposKitService.delete(req.params.id, req.user);
    res.json({ message: 'Tipo de kit eliminado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
