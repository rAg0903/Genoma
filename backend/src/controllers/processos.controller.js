const processosService = require('../services/processos.service');
const colheitasService = require('../services/colheitas.service');

exports.list = async (req, res) => {
  try {
    const processos = await processosService.listAll(req.user);
    res.json({ data: processos, count: processos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const processo = await processosService.getById(req.params.id, req.user);
    if (!processo) {
      return res.status(404).json({ error: 'Processo nao encontrado' });
    }
    res.json({ data: processo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listByPaciente = async (req, res) => {
  try {
    const processos = await processosService.listByPaciente(req.params.pacienteId, req.user);
    res.json({ data: processos, count: processos.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const processo = await processosService.create(req.body, req.user);
    res.status(201).json({ message: 'Processo criado com sucesso', data: processo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const processo = await processosService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Processo atualizado com sucesso', data: processo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getColheita = async (req, res) => {
  try {
    const colheita = await colheitasService.getColheitaProcesso(req.params.id, req.user);
    res.json({ data: colheita });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateColheita = async (req, res) => {
  try {
    const colheita = await colheitasService.updateColheitaProcesso(req.params.id, req.body, req.user);
    res.json({ message: 'Colheita actualizada com sucesso', data: colheita });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await processosService.delete(req.params.id, req.user);
    res.json({ message: 'Processo deletado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
