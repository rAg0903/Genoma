const perfisRepository = require('../repositories/perfis.repository');
const stockPermissionsRepository = require('../repositories/perfil_stock_submodulos.repository');
const {
  STOCK_SUBMODULES,
  normalizeRoleName,
  getDefaultStockPermissionsByRoleName,
} = require('../config/stock-permissions');

const isAdministrador = (perfilNome) => normalizeRoleName(perfilNome) === 'administrador';

const rowsToPermissionMap = (rows, perfilNome) => {
  const defaults = getDefaultStockPermissionsByRoleName(perfilNome);
  for (const row of rows) {
    defaults[row.submodulo] = !!row.permitido;
  }
  return defaults;
};

exports.getByPerfilId = async (perfilId) => {
  const perfil = await perfisRepository.findById(perfilId);
  if (!perfil) {
    throw new Error('Perfil não encontrado');
  }

  const defaults = getDefaultStockPermissionsByRoleName(perfil.nome);
  await stockPermissionsRepository.ensureDefaults(perfilId, defaults);
  const rows = await stockPermissionsRepository.listByPerfilId(perfilId);

  return {
    perfil_id: perfilId,
    perfil_nome: perfil.nome,
    permissoes: rowsToPermissionMap(rows, perfil.nome),
  };
};

exports.updateByPerfilId = async (perfilId, updates) => {
  const perfil = await perfisRepository.findById(perfilId);
  if (!perfil) {
    throw new Error('Perfil não encontrado');
  }

  if (isAdministrador(perfil.nome)) {
    throw new Error('O perfil Administrador está protegido e não permite alterações.');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Corpo inválido para atualização de permissões.');
  }

  const current = await exports.getByPerfilId(perfilId);
  const nextPermissions = { ...current.permissoes };

  for (const submodulo of Object.keys(updates)) {
    if (!STOCK_SUBMODULES.includes(submodulo)) {
      throw new Error(`Submódulo inválido: ${submodulo}`);
    }
    if (typeof updates[submodulo] !== 'boolean') {
      throw new Error(`Valor inválido para ${submodulo}. Use true ou false.`);
    }
    nextPermissions[submodulo] = updates[submodulo];
  }

  await stockPermissionsRepository.replaceByPerfilId(perfilId, nextPermissions);

  return {
    perfil_id: perfilId,
    perfil_nome: perfil.nome,
    permissoes: nextPermissions,
  };
};

exports.isStockSubmoduleAllowed = async (perfilId, submodulo) => {
  const data = await exports.getByPerfilId(perfilId);
  return !!data.permissoes[submodulo];
};
