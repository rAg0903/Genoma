const motivosAnulacaoService = require('../services/motivos_anulacao.service');

exports.list = async (req, res) => {
  try {
    const data = await motivosAnulacaoService.listAll();
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await motivosAnulacaoService.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Motivo de anulação não encontrado' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await motivosAnulacaoService.create(req.body, req.user);
    res.status(201).json({ message: 'Motivo de anulação criado com sucesso', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await motivosAnulacaoService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Motivo de anulação atualizado com sucesso', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await motivosAnulacaoService.delete(req.params.id, req.user);
    res.json({ message: 'Motivo de anulação eliminado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
