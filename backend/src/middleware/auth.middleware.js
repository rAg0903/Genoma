const jwt = require('jsonwebtoken');
const utilizadoresRepository = require('../repositories/utilizadores.repository');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded.sub || null;

    if (!userId) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const utilizador = await utilizadoresRepository.findById(userId);
    if (!utilizador || !utilizador.ativo) {
      return res.status(401).json({
        error: 'Sessão inválida. Inicie sessão novamente.',
        code: 'SESSION_STALE',
      });
    }

    req.user = {
      ...decoded,
      id: userId,
      perfil_id: utilizador.perfil_id,
      empresa_id: utilizador.empresa_id,
      nome: utilizador.nome,
      email: utilizador.email,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
