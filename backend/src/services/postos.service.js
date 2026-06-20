const postosRepository = require('../repositories/postos.repository');
const laboratoriosService = require('./laboratorios.service');
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
    await logService.log({ utilizador_id: user.id, empresa_id: user.empresa_id, acao, tabela: 'postos', registro_id: registroId });
  } catch (err) {
    console.warn('Falha ao registar auditoria de posto:', err.message);
  }
};

const mapPosto = (row) => ({
  id: row.id,
  nome: row.nome || '',
  codigo: row.codigo_posto || '',
  entidade_id: row.entidade_id || null,
  laboratorio_id: row.laboratorio_id || null,
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
  ...(data.codigo !== undefined ? { codigo_posto: data.codigo ? String(data.codigo).trim() : null } : {}),
  ...(data.codigo_posto !== undefined ? { codigo_posto: data.codigo_posto ? String(data.codigo_posto).trim() : null } : {}),
  ...(data.entidade_id !== undefined ? { entidade_id: data.entidade_id || null } : {}),
  ...(data.laboratorio_id !== undefined ? { laboratorio_id: data.laboratorio_id || null } : {}),
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

const resolveLaboratorioId = (fields, rowOrData) =>
  fields.laboratorio_id ?? rowOrData?.laboratorio_id ?? null;

const assertOperacionalLaboratorio = async (laboratorioId) => {
  if (!laboratorioId) return;
  const lab = await laboratoriosService.getById(laboratorioId);
  if (!lab) throw new Error('Laboratório associado não encontrado');
  if (lab.tipo === 'final') {
    throw new Error('Postos não podem ser associados a laboratórios finais (processamento). Use um laboratório operacional.');
  }
};

const applyLaboratorioInheritance = async (postos) => {
  const list = Array.isArray(postos) ? postos : [postos];
  const labIds = [...new Set(list.map((p) => p.laboratorio_id).filter(Boolean))];
  if (!labIds.length) return postos;

  const labs = await Promise.all(labIds.map((labId) => laboratoriosService.getById(labId)));
  const labById = new Map(labs.filter(Boolean).map((lab) => [lab.id, lab]));

  const enriched = list.map((posto) => {
    if (!posto.laboratorio_id) return posto;
    const lab = labById.get(posto.laboratorio_id);
    if (!lab) return posto;
    return {
      ...posto,
      condicoes_testes: lab.condicoes_testes || [],
    };
  });

  return Array.isArray(postos) ? enriched : enriched[0];
};

exports.listAll = async (laboratorioId = null) => {
  const rows = await postosRepository.findAll(laboratorioId || null);
  const mapped = await attachLocalExtras(rows, 'posto', mapPosto, localContactosRepository, localCondicoesRepository);
  return applyLaboratorioInheritance(mapped);
};

exports.getById = async (id) => {
  const row = await postosRepository.findById(id);
  if (!row) return null;
  const [mapped] = await attachLocalExtras([row], 'posto', mapPosto, localContactosRepository, localCondicoesRepository);
  return applyLaboratorioInheritance(mapped);
};

exports.create = async (data, user) => {
  if (!data.nome || !String(data.nome).trim()) {
    throw new Error('Nome do posto é obrigatório');
  }
  const fields = sanitize(data);
  if (fields.codigo_posto) {
    const existente = await postosRepository.findByCodigo(fields.codigo_posto);
    if (existente) throw new Error('Já existe um posto com este código');
  }
  const laboratorioId = resolveLaboratorioId(fields, data);
  await assertOperacionalLaboratorio(laboratorioId);
  const { id } = await postosRepository.create(fields);
  await localContactosRepository.replaceContactos('posto', id, normalizeContactos(data.contactos_secundarios));
  if (laboratorioId) {
    await localCondicoesRepository.replaceCondicoes('posto', id, []);
  } else {
    await localCondicoesRepository.replaceCondicoes('posto', id, normalizeCondicoesTestes(data.condicoes_testes));
  }
  await audit(user, `Criou posto ${fields.nome}`, id);
  return exports.getById(id);
};

exports.update = async (id, data, user) => {
  const posto = await postosRepository.findById(id);
  if (!posto) throw new Error('Posto não encontrado');
  const laboratorioId = resolveLaboratorioId(sanitize(data), { ...posto, laboratorio_id: data.laboratorio_id ?? posto.laboratorio_id });
  await assertOperacionalLaboratorio(laboratorioId);
  const fields = sanitize(data);
  if (fields.codigo_posto && fields.codigo_posto !== posto.codigo_posto) {
    const existente = await postosRepository.findByCodigo(fields.codigo_posto);
    if (existente && existente.id !== id) throw new Error('Já existe outro posto com este código');
  }
  await postosRepository.update(id, fields);
  if (data.contactos_secundarios !== undefined) {
    await localContactosRepository.replaceContactos('posto', id, normalizeContactos(data.contactos_secundarios));
  }
  if (laboratorioId) {
    await localCondicoesRepository.replaceCondicoes('posto', id, []);
  } else if (data.condicoes_testes !== undefined) {
    await localCondicoesRepository.replaceCondicoes('posto', id, normalizeCondicoesTestes(data.condicoes_testes));
  }
  await audit(user, `Atualizou posto ${posto.nome}`, id);
  return exports.getById(id);
};

exports.delete = async (id, user) => {
  const posto = await postosRepository.findById(id);
  if (!posto) throw new Error('Posto não encontrado');
  const kits = await postosRepository.countKits(id);
  if (kits > 0) {
    throw new Error(`Não é possível eliminar um posto com ${kits} kit(s) associado(s)`);
  }
  await postosRepository.delete(id);
  await audit(user, `Eliminou posto ${posto.nome}`, id);
  return true;
};

// Validação de stock para a colheita: kits disponíveis no posto (opcionalmente por teste).
exports.getStockDisponivel = async (id, testeId = null) => {
  const posto = await postosRepository.findById(id);
  if (!posto) throw new Error('Posto não encontrado');
  const total = await postosRepository.countKitsDisponiveis(id, testeId || null);
  return { posto_id: id, posto_nome: posto.nome, disponiveis: total, teste_id: testeId || null };
};

exports.usarKit = async (kitId, user, options = {}) => {
  if (!kitId) throw new Error('Kit é obrigatório');
  const ok = await postosRepository.usarKit(kitId, {
    processoId: options.processo_id || null,
    postoId: options.posto_id || null,
    laboratorioFinalId: options.laboratorio_final_id || null,
  });
  if (!ok) throw new Error('Kit não encontrado');
  await audit(user, 'Kit utilizado em colheita', kitId);
  return true;
};

exports.listKitsDisponiveis = async (id, testeId = null) => {
  const posto = await postosRepository.findById(id);
  if (!posto) throw new Error('Posto não encontrado');
  const rows = await postosRepository.findKitsDisponiveis(id, testeId || null);
  return rows.map((row) => ({
    id: row.id,
    codigo_barras: row.codigo_barras || '',
    tracking: row.tracking || '',
    tipo_kit: row.tipo_kit_nome || '',
    teste_nome: row.teste_nome || '',
    teste_id: row.teste_id || null,
    data_validade: row.data_validade ? String(row.data_validade).split('T')[0] : '',
  }));
};
