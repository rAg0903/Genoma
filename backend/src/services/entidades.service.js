const entidadesRepository = require('../repositories/entidades.repository');
const localContactosRepository = require('../repositories/local-contactos.repository');
const localCondicoesRepository = require('../repositories/local-condicoes.repository');
const {
  normalizeContactos,
  normalizeCondicoesTestes,
  attachLocalExtras,
} = require('./local-contactos.util');
const logService = require('./log.service');

const audit = async (user, acao, registroId) => {
  if (!user || !user.id) return;
  try {
    await logService.log({ utilizador_id: user.id, empresa_id: user.empresa_id, acao, tabela: 'entidades', registro_id: registroId });
  } catch (err) {
    console.warn('Falha ao registar auditoria de entidade:', err.message);
  }
};

const mapEntidade = (row) => ({
  id: row.id,
  nome: row.nome || '',
  codigo: row.codigo || '',
  morada: row.morada || '',
  codigo_postal: row.codigo_postal || '',
  cidade: row.cidade || '',
  distrito: row.distrito || '',
  pais: row.pais || '',
  contacto: row.contacto || '',
  email: row.email || '',
  notas: row.notas || '',
  ativo: row.ativo === undefined || row.ativo === null ? true : !!row.ativo,
});

const sanitize = (data) => ({
  ...(data.nome !== undefined ? { nome: String(data.nome).trim() } : {}),
  ...(data.codigo !== undefined ? { codigo: data.codigo ? String(data.codigo).trim() : null } : {}),
  ...(data.morada !== undefined ? { morada: data.morada ? String(data.morada).trim() : null } : {}),
  ...(data.codigo_postal !== undefined ? { codigo_postal: data.codigo_postal ? String(data.codigo_postal).trim() : null } : {}),
  ...(data.cidade !== undefined ? { cidade: data.cidade ? String(data.cidade).trim() : null } : {}),
  ...(data.distrito !== undefined ? { distrito: data.distrito ? String(data.distrito).trim() : null } : {}),
  ...(data.pais !== undefined ? { pais: data.pais ? String(data.pais).trim() : null } : {}),
  ...(data.contacto !== undefined ? { contacto: data.contacto ? String(data.contacto).trim() : null } : {}),
  ...(data.email !== undefined ? { email: data.email ? String(data.email).trim() : null } : {}),
  ...(data.notas !== undefined ? { notas: data.notas ? String(data.notas).trim() : null } : {}),
  ...(data.ativo !== undefined ? { ativo: !!data.ativo } : {}),
});

exports.listAll = async () => {
  const rows = await entidadesRepository.findAll();
  return attachLocalExtras(rows, 'entidade', mapEntidade, localContactosRepository, localCondicoesRepository);
};

exports.getById = async (id) => {
  const row = await entidadesRepository.findById(id);
  if (!row) return null;
  const [mapped] = await attachLocalExtras([row], 'entidade', mapEntidade, localContactosRepository, localCondicoesRepository);
  return mapped;
};

exports.create = async (data, user) => {
  if (!data.nome || !String(data.nome).trim()) {
    throw new Error('Nome da entidade é obrigatório');
  }
  const fields = sanitize(data);
  if (fields.codigo) {
    const existente = await entidadesRepository.findByCodigo(fields.codigo);
    if (existente) throw new Error('Já existe uma entidade com este código');
  }
  const { id } = await entidadesRepository.create(fields);
  await localContactosRepository.replaceContactos('entidade', id, normalizeContactos(data.contactos_secundarios));
  await localCondicoesRepository.replaceCondicoes('entidade', id, normalizeCondicoesTestes(data.condicoes_testes));
  await audit(user, `Criou entidade ${fields.nome}`, id);
  return exports.getById(id);
};

exports.update = async (id, data, user) => {
  const entidade = await entidadesRepository.findById(id);
  if (!entidade) throw new Error('Entidade não encontrada');
  const fields = sanitize(data);
  if (fields.codigo && fields.codigo !== entidade.codigo) {
    const existente = await entidadesRepository.findByCodigo(fields.codigo);
    if (existente && existente.id !== id) throw new Error('Já existe outra entidade com este código');
  }
  await entidadesRepository.update(id, fields);
  if (data.contactos_secundarios !== undefined) {
    await localContactosRepository.replaceContactos('entidade', id, normalizeContactos(data.contactos_secundarios));
  }
  if (data.condicoes_testes !== undefined) {
    await localCondicoesRepository.replaceCondicoes('entidade', id, normalizeCondicoesTestes(data.condicoes_testes));
  }
  await audit(user, `Atualizou entidade ${entidade.nome}`, id);
  return exports.getById(id);
};

exports.delete = async (id, user) => {
  const entidade = await entidadesRepository.findById(id);
  if (!entidade) throw new Error('Entidade não encontrada');
  await entidadesRepository.delete(id);
  await audit(user, `Eliminou entidade ${entidade.nome}`, id);
  return true;
};
