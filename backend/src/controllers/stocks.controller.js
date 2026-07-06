const stocksService = require('../services/stocks.service');
const logRepository = require('../repositories/log.repository');

exports.getKits = async (req, res) => {
  try {
    const kits = await stocksService.listKits();
    res.json({ data: kits, count: kits.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLotes = async (req, res) => {
  try {
    const lotes = await stocksService.listLotes();
    res.json({ data: lotes, count: lotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLote = async (req, res) => {
  try {
    const lote = await stocksService.createLote(req.body, req.user);
    res.status(201).json({ message: 'Lote criado com sucesso', data: lote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRequisicoes = async (req, res) => {
  try {
    const requisicoes = await stocksService.listRequisicoes();
    res.json({ data: requisicoes, count: requisicoes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMovimentos = async (req, res) => {
  try {
    const movimentos = await stocksService.listMovimentos();
    res.json({ data: movimentos, count: movimentos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuditoria = async (req, res) => {
  try {
    const logs = await logRepository.findAll();
    const data = logs.map((l) => ({
      id: l.id,
      data: l.data,
      utilizador: l.utilizador_nome || '',
      acao: l.acao,
      tabela: l.tabela_afetada,
      registro_id: l.registro_id,
    }));
    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRequisicao = async (req, res) => {
  try {
    const requisicao = await stocksService.createRequisicao(req.body, req.user);
    res.status(201).json({ message: 'Requisição criada com sucesso', data: requisicao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createDescarte = async (req, res) => {
  try {
    const descarte = await stocksService.createDescarte(req.body, req.user);
    res.status(201).json({ message: 'Descarte/envio para laboratório registado', data: descarte });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateRequisicao = async (req, res) => {
  try {
    await stocksService.updateRequisicao(req.params.id, req.body, req.user);
    res.json({ message: 'Requisição atualizada com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRequisicao = async (req, res) => {
  try {
    await stocksService.deleteRequisicao(req.params.id, req.user);
    res.json({ message: 'Requisição removida com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createMovimento = async (req, res) => {
  try {
    const movimento = await stocksService.createMovimento(req.body, req.user);
    res.status(201).json({ message: 'Movimento registado com sucesso', data: movimento });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMovimento = async (req, res) => {
  try {
    await stocksService.deleteMovimento(req.params.id, req.user);
    res.json({ message: 'Movimento removido com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.checkKitDuplicado = async (req, res) => {
  try {
    const result = await stocksService.checkKitDuplicado(req.query.codigo_barras);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createKit = async (req, res) => {
  try {
    const kit = await stocksService.createKit(req.body, req.user);
    res.status(201).json({ message: 'Kit criado com sucesso', data: kit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateKit = async (req, res) => {
  try {
    const kit = await stocksService.updateKit(req.params.id, req.body, req.user);
    res.json({ message: 'Kit atualizado com sucesso', data: kit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteKit = async (req, res) => {
  try {
    await stocksService.deleteKit(req.params.id, req.user);
    res.json({ message: 'Kit removido com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateLote = async (req, res) => {
  try {
    await stocksService.updateLote(req.params.id, req.body, req.user);
    res.json({ message: 'Lote atualizado com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.confirmLabArrival = async (req, res) => {
  try {
    const kit = await stocksService.confirmLabArrival(req.params.id, req.body, req.user);
    res.json({ message: 'Recepção no laboratório confirmada', data: kit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.revertDescarteForKit = async (req, res) => {
  try {
    const kit = await stocksService.revertDescarteForKit(req.params.id, req.body, req.user);
    res.json({ message: 'Kit devolvido à origem com sucesso', data: kit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getKitTrace = async (req, res) => {
  try {
    const trace = await stocksService.getKitTrace(req.params.id);
    res.json({ data: trace, count: trace.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
