const laboratoriosRepository = require('../repositories/laboratorios.repository');
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
    await logService.log({ utilizador_id: user.id, empresa_id: user.empresa_id, acao, tabela: 'laboratorios', registro_id: registroId });
  } catch (err) {
    console.warn('Falha ao registar auditoria de laboratório:', err.message);
  }
};

const mapLaboratorio = (row) => ({
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
  tipo: row.tipo === 'final' ? 'final' : 'operacional',
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
  ...(data.tipo !== undefined ? { tipo: data.tipo === 'final' ? 'final' : 'operacional' } : {}),
});

exports.listAll = async () => {
  const rows = await laboratoriosRepository.findAll();
  return attachLocalExtras(rows, 'laboratorio', mapLaboratorio, localContactosRepository, localCondicoesRepository);
};

exports.getById = async (id) => {
  const row = await laboratoriosRepository.findById(id);
  if (!row) return null;
  const [mapped] = await attachLocalExtras([row], 'laboratorio', mapLaboratorio, localContactosRepository, localCondicoesRepository);
  return mapped;
};

exports.create = async (data, user) => {
  if (!data.nome || !String(data.nome).trim()) {
    throw new Error('Nome do laboratório é obrigatório');
  }
  const tipo = data.tipo === 'final' ? 'final' : 'operacional';
  const fields = sanitize({ ...data, tipo });
  if (fields.codigo) {
    const existente = await laboratoriosRepository.findByCodigo(fields.codigo);
    if (existente) throw new Error('Já existe um laboratório com este código');
  }
  const { id } = await laboratoriosRepository.create(fields);
  if (tipo === 'final') {
    await localContactosRepository.replaceContactos('laboratorio', id, normalizeContactos(data.contactos_secundarios));
  } else {
    await localContactosRepository.replaceContactos('laboratorio', id, normalizeContactos(data.contactos_secundarios));
    await localCondicoesRepository.replaceCondicoes('laboratorio', id, normalizeCondicoesTestes(data.condicoes_testes));
  }
  await audit(user, `Criou laboratório ${fields.nome}`, id);
  return exports.getById(id);
};

exports.update = async (id, data, user) => {
  const lab = await laboratoriosRepository.findById(id);
  if (!lab) throw new Error('Laboratório não encontrado');
  const currentTipo = lab.tipo === 'final' ? 'final' : 'operacional';
  if (data.tipo !== undefined && data.tipo !== currentTipo) {
    if (currentTipo === 'final') {
      const testesCount = await laboratoriosRepository.countTestesComLabFinal(id);
      if (testesCount > 0) {
        throw new Error('Não é possível alterar o tipo: laboratório associado a testes');
      }
    } else {
      const postosCount = await laboratoriosRepository.countPostosAssociados(id);
      if (postosCount > 0) {
        throw new Error('Não é possível alterar o tipo: laboratório tem postos associados');
      }
    }
  }
  const fields = sanitize(data);
  if (fields.codigo && fields.codigo !== lab.codigo) {
    const existente = await laboratoriosRepository.findByCodigo(fields.codigo);
    if (existente && existente.id !== id) throw new Error('Já existe outro laboratório com este código');
  }
  await laboratoriosRepository.update(id, fields);
  if (data.contactos_secundarios !== undefined) {
    await localContactosRepository.replaceContactos('laboratorio', id, normalizeContactos(data.contactos_secundarios));
  }
  const tipo = (fields.tipo || currentTipo);
  if (data.condicoes_testes !== undefined && tipo !== 'final') {
    await localCondicoesRepository.replaceCondicoes('laboratorio', id, normalizeCondicoesTestes(data.condicoes_testes));
  }
  await audit(user, `Atualizou laboratório ${lab.nome}`, id);
  return exports.getById(id);
};

exports.delete = async (id, user) => {
  const lab = await laboratoriosRepository.findById(id);
  if (!lab) throw new Error('Laboratório não encontrado');
  if (lab.tipo === 'final') {
    const testesCount = await laboratoriosRepository.countTestesComLabFinal(id);
    if (testesCount > 0) {
      throw new Error(`Não é possível eliminar: ${testesCount} teste(s) associam este laboratório final`);
    }
  } else {
    const postosCount = await laboratoriosRepository.countPostosAssociados(id);
    if (postosCount > 0) {
      throw new Error(`Não é possível eliminar: ${postosCount} posto(s) associado(s)`);
    }
  }
  await laboratoriosRepository.delete(id);
  await audit(user, `Eliminou laboratório ${lab.nome}`, id);
  return true;
};
