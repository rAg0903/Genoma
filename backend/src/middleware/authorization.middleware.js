const perfisRepository = require('../repositories/perfis.repository');
const perfilStockSubmodulosService = require('../services/perfil_stock_submodulos.service');
const { STOCK_SUBMODULES, normalizeRoleName } = require('../config/stock-permissions');

const getPerfilIdFromRequestUser = (user) => user?.role || user?.perfil_id || null;

const isAdminByPerfilNome = (perfilNome) => normalizeRoleName(perfilNome) === 'administrador';

const resolvePerfil = async (req) => {
  const perfilId = getPerfilIdFromRequestUser(req.user);
  if (!perfilId) return null;
  return perfisRepository.findById(perfilId);
};

exports.requireAdmin = async (req, res, next) => {
  try {
    const perfil = await resolvePerfil(req);
    if (!perfil || !isAdminByPerfilNome(perfil.nome)) {
      return res.status(403).json({ error: 'Apenas Administrador pode executar esta ação.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/** Permite admin consultar qualquer perfil; outros utilizadores só o próprio. */
exports.requireSelfOrAdminForPerfil = async (req, res, next) => {
  try {
    const perfil = await resolvePerfil(req);
    if (!perfil) {
      return res.status(403).json({ error: 'Perfil não identificado para autorização.' });
    }

    if (isAdminByPerfilNome(perfil.nome)) {
      return next();
    }

    const userPerfilId = getPerfilIdFromRequestUser(req.user);
    if (userPerfilId && userPerfilId === req.params.id) {
      return next();
    }

    return res.status(403).json({ error: 'Sem permissão para consultar permissões deste perfil.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.requireStockSubmoduleAccess = (submodulo) => {
  if (!STOCK_SUBMODULES.includes(submodulo)) {
    throw new Error(`Submódulo de Stocks inválido: ${submodulo}`);
  }

  return async (req, res, next) => {
    try {
      const perfil = await resolvePerfil(req);
      if (!perfil) {
        return res.status(403).json({ error: 'Perfil não identificado para autorização.' });
      }

      if (isAdminByPerfilNome(perfil.nome)) {
        return next();
      }

      const allowed = await perfilStockSubmodulosService.isStockSubmoduleAllowed(perfil.id, submodulo);
      if (!allowed) {
        return res.status(403).json({
          error: `Sem permissão para aceder ao submódulo de Stocks: ${submodulo}.`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};
