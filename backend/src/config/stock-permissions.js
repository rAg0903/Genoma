const STOCK_SUBMODULES = ['kits', 'lotes', 'requisicoes', 'descartes', 'movimentos', 'auditoria'];

const DEFAULT_STOCK_SUBMODULE_PERMISSIONS_BY_ROLE = {
  administrador: {
    kits: true,
    lotes: true,
    requisicoes: true,
    descartes: true,
    movimentos: true,
    auditoria: true,
  },
  medico: {
    kits: true,
    lotes: true,
    requisicoes: true,
    descartes: true,
    movimentos: true,
    auditoria: true,
  },
  assistente: {
    kits: true,
    lotes: true,
    requisicoes: true,
    descartes: true,
    movimentos: true,
    auditoria: true,
  },
};

function normalizeRoleName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildAllowAllPermissions() {
  return STOCK_SUBMODULES.reduce((acc, submodule) => {
    acc[submodule] = true;
    return acc;
  }, {});
}

function getDefaultStockPermissionsByRoleName(roleName) {
  const normalizedRole = normalizeRoleName(roleName);
  return {
    ...buildAllowAllPermissions(),
    ...(DEFAULT_STOCK_SUBMODULE_PERMISSIONS_BY_ROLE[normalizedRole] || {}),
  };
}

module.exports = {
  STOCK_SUBMODULES,
  normalizeRoleName,
  getDefaultStockPermissionsByRoleName,
};
