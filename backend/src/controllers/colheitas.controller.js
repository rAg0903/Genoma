const colheitasService = require('../services/colheitas.service');

exports.list = async (req, res) => {
  try {
    const agendamentos = await colheitasService.listAgendamentos({
      from: req.query.from,
      to: req.query.to,
      posto_id: req.query.posto_id,
    });
    res.json({ data: agendamentos, count: agendamentos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calendario = async (req, res) => {
  try {
    const dias = await colheitasService.getCalendario({
      from: req.query.from,
      to: req.query.to,
    });
    res.json({ data: dias, count: dias.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const agendamento = await colheitasService.createAgendamento(req.body, req.user);
    res.status(201).json({ message: 'Colheita agendada com sucesso', data: agendamento });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.previewLaboratorioFinal = async (req, res) => {
  try {
    const data = await colheitasService.previewLaboratorioFinal({
      processo_id: req.query.processo_id,
      posto_id: req.query.posto_id,
      laboratorio_final_id: req.query.laboratorio_final_id,
    });
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.registar = async (req, res) => {
  try {
    const agendamento = await colheitasService.registarColheita(req.params.id, req.body, req.user);
    res.json({ message: 'Colheita registada com sucesso', data: agendamento });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    await colheitasService.cancelAgendamento(req.params.id, req.user);
    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
