const configuracaoSistemaService = require('../services/configuracao-sistema.service');

exports.get = async (req, res) => {
  try {
    const data = await configuracaoSistemaService.get();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.save = async (req, res) => {
  try {
    const data = await configuracaoSistemaService.save(req.body, req.user);
    res.json({ message: 'Configuração guardada com sucesso', data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
