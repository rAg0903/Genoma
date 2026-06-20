const anexosService = require('../services/anexos.service');

exports.listByPaciente = async (req, res) => {
  try {
    const data = await anexosService.listByPaciente(req.params.pacienteId);
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listByProcesso = async (req, res) => {
  try {
    const data = await anexosService.listByProcesso(req.params.processoId);
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const anexo = await anexosService.create(req.body, req.user);
    res.status(201).json({ message: 'Anexo adicionado com sucesso', data: anexo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await anexosService.delete(req.params.id, req.user);
    res.json({ message: 'Anexo removido com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
