const notificacoesService = require('../services/notificacoes.service');

exports.list = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const apenasNaoLidas = req.query.apenas_nao_lidas === '1' || req.query.apenas_nao_lidas === 'true';
    const result = await notificacoesService.listForUser(req.user.id, { limit, apenasNaoLidas });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    await notificacoesService.markRead(req.user.id, id);
    res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await notificacoesService.markAllRead(req.user.id);
    res.json({ message: 'Todas as notificações foram marcadas como lidas', ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
