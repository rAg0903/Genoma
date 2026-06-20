const requisicoesService = require('../services/requisicoes.service');

exports.create = async (req, res) => {
  try {
    const resultado = await requisicoesService.criarRequisicao(req.body, req.user);
    res.status(201).json({ message: 'Requisicao recebida com sucesso', data: resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
