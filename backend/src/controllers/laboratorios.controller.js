const laboratoriosService = require('../services/laboratorios.service');

exports.list = async (req, res) => {
  try {
    const laboratorios = await laboratoriosService.listAll();
    res.json({ data: laboratorios, count: laboratorios.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const lab = await laboratoriosService.getById(req.params.id);
    if (!lab) return res.status(404).json({ error: 'Laboratório não encontrado' });
    res.json({ data: lab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const lab = await laboratoriosService.create(req.body, req.user);
    res.status(201).json({ message: 'Laboratório criado com sucesso', data: lab });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const lab = await laboratoriosService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Laboratório atualizado com sucesso', data: lab });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await laboratoriosService.delete(req.params.id, req.user);
    res.json({ message: 'Laboratório eliminado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
