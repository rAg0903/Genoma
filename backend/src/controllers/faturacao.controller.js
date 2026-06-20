const faturacaoService = require('../services/faturacao.service');

exports.get = async (req, res) => {
  try {
    const faturacao = await faturacaoService.getFaturacao(req.params.id, req.user);
    res.json({ data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.emitir = async (req, res) => {
  try {
    const faturacao = await faturacaoService.emitirFatura(req.params.id, req.body, req.user);
    res.status(201).json({ message: 'Fatura emitida com sucesso', data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.registarPagamento = async (req, res) => {
  try {
    const faturacao = await faturacaoService.registarPagamento(req.params.id, req.body, req.user);
    res.json({ message: 'Pagamento registado com sucesso', data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
