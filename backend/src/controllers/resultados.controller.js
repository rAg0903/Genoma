const resultadosService = require('../services/resultados.service');
const relatoriosService = require('../services/relatorios.service');

exports.getResultados = async (req, res) => {
  try {
    const resultados = await resultadosService.getResultados(req.params.id, req.user);
    res.json({ data: resultados });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.registarResultados = async (req, res) => {
  try {
    const resultados = await resultadosService.registarResultados(req.params.id, req.body, req.user);
    res.status(201).json({ message: 'Resultados registados com sucesso', data: resultados });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.validar = async (req, res) => {
  try {
    const resultados = await resultadosService.validarResultado(req.params.id, req.body, req.user);
    res.json({ message: 'Resultado validado com sucesso', data: resultados });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listRelatorios = async (req, res) => {
  try {
    const relatorios = await relatoriosService.listRelatorios(req.params.id, req.user);
    res.json({ data: relatorios, count: relatorios.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.gerarRelatorio = async (req, res) => {
  try {
    const relatorio = await relatoriosService.gerarRelatorio(req.params.id, req.body, req.user);
    res.status(201).json({ message: 'Relatorio gerado com sucesso', data: relatorio });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRelatorioHtml = async (req, res) => {
  try {
    const html = await relatoriosService.getRelatorioHtml(req.params.id, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.enviarRelatorio = async (req, res) => {
  try {
    const envio = await relatoriosService.registarEnvio(req.params.id, req.body, req.user);
    res.json({ message: 'Relatorio enviado com sucesso', data: envio });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
