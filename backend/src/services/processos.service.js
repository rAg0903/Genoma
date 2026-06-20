const processosRepository = require('../repositories/processos.repository');
const pacientesRepository = require('../repositories/pacientes.repository');
const medicosRepository = require('../repositories/medicos.repository');
const testesRepository = require('../repositories/testes.repository');
const empresasRepository = require('../repositories/empresas.repository');
const stocksRepository = require('../repositories/stocks.repository');
const perfisRepository = require('../repositories/perfis.repository');
const informacaoClinicaRepository = require('../repositories/informacao_clinica.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const logService = require('./log.service');
const { normalizeRoleName } = require('../config/stock-permissions');
const { formatCalendarDate } = require('../utils/calendar-dates');

const PROCESSO_DATE_FIELDS = [
  'data_entrada',
  'data_colheita',
  'data_colheita_prevista',
  'data_chegada_laboratorio',
  'data_resultado',
  'data_validacao',
  'data_envio_relatorio',
  'fatura_data_emissao',
  'pagamento_data',
];

const mapProcessoResponse = (row) => {
  if (!row) return row;
  const mapped = { ...row };
  for (const field of PROCESSO_DATE_FIELDS) {
    if (mapped[field] != null && mapped[field] !== '') {
      mapped[field] = formatCalendarDate(mapped[field]);
    }
  }
  return mapped;
};

// Indica se o utilizador autenticado é um Médico (perfil), para limitar a
// visibilidade aos seus próprios processos.
const isMedicoUser = async (user) => {
  if (!user || !user.role) return false;
  try {
    const perfil = await perfisRepository.findById(user.role);
    return perfil ? normalizeRoleName(perfil.nome) === 'medico' : false;
  } catch {
    return false;
  }
};

const STATUS_CANONICOS = [
  'Agendado',
  'Kit Reservado',
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
  'Cancelado',
];

const RELATORIO_DESTINOS_VALIDOS = ['Nenhum', 'Medico', 'Utente', 'Ambos'];

// Maquina de estados do Processo. Define para cada estado os estados de destino
// validos. Cancelado e atingivel a partir de qualquer estado nao-terminal.
const TRANSICOES_VALIDAS = {
  'Agendado': ['Kit Reservado', 'Cancelado'],
  'Kit Reservado': ['Colheita Realizada', 'Agendado', 'Cancelado'],
  'Colheita Realizada': ['Enviado Laboratorio', 'Cancelado'],
  'Enviado Laboratorio': ['Em Analise', 'Cancelado'],
  'Em Analise': ['Resultado Disponivel', 'Cancelado'],
  'Resultado Disponivel': ['Validado', 'Cancelado'],
  'Validado': ['Faturado', 'Cancelado'],
  'Faturado': [],
  'Cancelado': [],
};

const assertTransicaoValida = (atual, destino) => {
  if (!atual || atual === destino) return;
  const permitidos = TRANSICOES_VALIDAS[atual] || [];
  if (!permitidos.includes(destino)) {
    throw new Error(
      `Transicao de estado invalida: "${atual}" -> "${destino}". Estados permitidos: ${permitidos.length ? permitidos.join(', ') : 'nenhum (estado terminal)'}.`
    );
  }
};

exports.TRANSICOES_VALIDAS = TRANSICOES_VALIDAS;
exports.assertTransicaoValida = assertTransicaoValida;

const normalizeStringOrNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const normalizeStatus = (status) => {
  if (!status) return null;
  const normalized = String(status).trim().toLowerCase();
  const canonico = STATUS_CANONICOS.find((s) => s.toLowerCase() === normalized);
  if (canonico) return canonico;
  if (normalized === 'aguardando colheita' || normalized === 'pendente') return 'Agendado';
  if (normalized === 'kit reservado' || normalized === 'reservado') return 'Kit Reservado';
  if (normalized === 'colheita realizada') return 'Colheita Realizada';
  if (normalized === 'em laboratorio' || normalized === 'em laboratório' || normalized === 'enviado laboratorio') return 'Enviado Laboratorio';
  if (normalized === 'em analise' || normalized === 'em análise') return 'Em Analise';
  if (normalized === 'concluido' || normalized === 'concluído' || normalized === 'resultado disponivel' || normalized === 'resultado disponível') return 'Resultado Disponivel';
  if (normalized === 'validado') return 'Validado';
  if (normalized === 'faturado') return 'Faturado';
  if (normalized === 'cancelado') return 'Cancelado';
  return null;
};

const statusExigeKit = (status) => [
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
].includes(status);

const normalizeWorkflowPayload = (data) => {
  const normalized = {};

  if (data.numero_processo !== undefined) normalized.numero_processo = normalizeStringOrNull(data.numero_processo);
  if (data.posto !== undefined) normalized.posto = normalizeStringOrNull(data.posto);
  if (data.posto_id !== undefined) normalized.posto_id = normalizeStringOrNull(data.posto_id);
  if (data.kit_codigo !== undefined) normalized.kit_codigo = normalizeStringOrNull(data.kit_codigo);
  if (data.data_colheita !== undefined) normalized.data_colheita = normalizeStringOrNull(data.data_colheita);
  if (data.data_colheita_prevista !== undefined) normalized.data_colheita_prevista = normalizeStringOrNull(data.data_colheita_prevista);
  if (data.data_chegada_laboratorio !== undefined) normalized.data_chegada_laboratorio = normalizeStringOrNull(data.data_chegada_laboratorio);
  if (data.data_resultado !== undefined) normalized.data_resultado = normalizeStringOrNull(data.data_resultado);
  if (data.data_validacao !== undefined) normalized.data_validacao = normalizeStringOrNull(data.data_validacao);
  if (data.data_envio_relatorio !== undefined) normalized.data_envio_relatorio = normalizeStringOrNull(data.data_envio_relatorio);
  if (data.responsavel_fluxo !== undefined) normalized.responsavel_fluxo = normalizeStringOrNull(data.responsavel_fluxo);
  if (data.observacoes !== undefined) normalized.observacoes = normalizeStringOrNull(data.observacoes);
  if (data.notas_clinicas !== undefined && data.observacoes === undefined) {
    normalized.observacoes = normalizeStringOrNull(data.notas_clinicas);
  }
  if (data.relatorio_validado !== undefined) normalized.relatorio_validado = !!data.relatorio_validado;

  if (data.relatorio_enviado_para !== undefined) {
    if (!RELATORIO_DESTINOS_VALIDOS.includes(data.relatorio_enviado_para)) {
      throw new Error(`Destino de relatorio invalido. Valores validos: ${RELATORIO_DESTINOS_VALIDOS.join(', ')}`);
    }
    normalized.relatorio_enviado_para = data.relatorio_enviado_para;
  }

  if (data.resultado_tudo_ok !== undefined) normalized.resultado_tudo_ok = !!data.resultado_tudo_ok;
  if (data.resultado_anomalias !== undefined) normalized.resultado_anomalias = normalizeStringOrNull(data.resultado_anomalias);
  if (data.fracao_fetal !== undefined) normalized.fracao_fetal = normalizeStringOrNull(data.fracao_fetal);
  if (data.fatura_emitida !== undefined) normalized.fatura_emitida = !!data.fatura_emitida;
  if (data.fatura_numero !== undefined) normalized.fatura_numero = normalizeStringOrNull(data.fatura_numero);
  if (data.fatura_data_emissao !== undefined) normalized.fatura_data_emissao = normalizeStringOrNull(data.fatura_data_emissao);
  if (data.valor_base !== undefined) normalized.valor_base = Number(data.valor_base) || 0;
  if (data.desconto_percentual !== undefined) normalized.desconto_percentual = Number(data.desconto_percentual) || 0;
  if (data.valor_final !== undefined) normalized.valor_final = Number(data.valor_final) || 0;
  if (data.pagamento_data !== undefined) normalized.pagamento_data = normalizeStringOrNull(data.pagamento_data);
  if (data.recibo_numero !== undefined) normalized.recibo_numero = normalizeStringOrNull(data.recibo_numero);
  if (data.pago !== undefined) normalized.pago = !!data.pago;

  return normalized;
};

const resolveKitId = async (kitCodigo) => {
  if (!kitCodigo) return null;
  const kit = await stocksRepository.findKitByCodigo(kitCodigo);
  return kit ? kit.id : null;
};

const mergeInformacaoClinicaIntoProcesso = (processo, info) => {
  const mapped = mapProcessoResponse(processo);
  if (!info) return mapped;
  return {
    ...mapped,
    informacao_clinica: info,
    tipo_gravidez: info.tipo_gravidez || null,
    onde_seguida: info.motivo_prescricao || null,
    gestacao_semanas_registo: info.semanas_gravidez ?? null,
    gestacao_dias_registo: info.dias_gravidez ?? null,
    gestacao_registada_em: info.gestacao_registada_em
      ? formatCalendarDate(info.gestacao_registada_em)
      : null,
  };
};

const attachInformacaoClinica = async (processo) => {
  if (!processo) return processo;
  const rows = await informacaoClinicaRepository.findByProcesso(processo.id);
  return mergeInformacaoClinicaIntoProcesso(processo, rows[0] || null);
};

const syncInformacaoClinica = async (processoId, data) => {
  const hasInfo = data.tipo_gravidez !== undefined
    || data.motivo_prescricao !== undefined
    || data.onde_seguida !== undefined
    || data.semanas_gravidez !== undefined
    || data.dias_gravidez !== undefined
    || data.gestacao_semanas_registo !== undefined
    || data.gestacao_dias_registo !== undefined
    || data.gestacao_registada_em !== undefined;
  if (!hasInfo) return;
  await informacaoClinicaRepository.upsertForProcesso(processoId, data);
};

const buildClinicoSnapshotFromPaciente = (data, paciente) => ({
  tipo_gravidez: data.tipo_gravidez ?? paciente.tipo_gravidez ?? null,
  onde_seguida: data.onde_seguida ?? paciente.onde_seguida ?? null,
  gestacao_semanas_registo: data.gestacao_semanas_registo ?? paciente.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: data.gestacao_dias_registo ?? paciente.gestacao_dias_registo ?? null,
  gestacao_registada_em: data.gestacao_registada_em ?? paciente.gestacao_registada_em ?? null,
  data_colheita_prevista: data.data_colheita_prevista ?? paciente.data_colheita_prevista ?? null,
});

const resolveEmpresaId = async (data, medicoId) => {
  if (data.empresa_id) {
    const empresa = await empresasRepository.findById(data.empresa_id);
    if (empresa) return data.empresa_id;
  }

  if (medicoId) {
    const utilizadorMedico = await utilizadoresRepository.findById(medicoId);
    if (utilizadorMedico?.empresa_id) {
      const empresa = await empresasRepository.findById(utilizadorMedico.empresa_id);
      if (empresa) return utilizadorMedico.empresa_id;
    }
  }

  const empresas = await empresasRepository.findAll();
  const ativa = empresas.find((e) => e.ativo !== 0 && e.ativo !== false) || empresas[0];
  return ativa?.id || null;
};

exports.listAll = async (user) => {
  let rows;
  // Médico só vê os seus próprios processos.
  if (await isMedicoUser(user)) {
    rows = await processosRepository.findByMedico(user.id);
  } else if (user.empresa_id) {
    rows = await processosRepository.findByEmpresa(user.empresa_id);
  } else {
    rows = await processosRepository.findAll();
  }
  return Promise.all(rows.map((row) => attachInformacaoClinica(row)));
};

exports.getById = async (id, user) => {
  const processo = await processosRepository.findById(id);
  if (!processo) throw new Error('Processo nao encontrado');

  if (await isMedicoUser(user) && processo.medico_id !== user.id) {
    throw new Error('Sem permissao para aceder a este processo');
  }

  if (user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para aceder a este processo');
  }

  return attachInformacaoClinica(processo);
};

exports.listByPaciente = async (pacienteId, user) => {
  const paciente = await pacientesRepository.findById(pacienteId);
  if (!paciente) throw new Error('Paciente nao encontrado');

  const rows = await processosRepository.findByPaciente(pacienteId);
  return Promise.all(rows.map((row) => attachInformacaoClinica(row)));
};

exports.create = async (data, user) => {
  if (!data.paciente_id || !data.medico_id) {
    throw new Error('Paciente e medico sao obrigatorios');
  }

  const paciente = await pacientesRepository.findById(data.paciente_id);
  if (!paciente) throw new Error('Paciente nao encontrado');

  const processosExistentes = await processosRepository.findByPaciente(data.paciente_id);
  const jaTemProcesso = processosExistentes.some((p) => p.status !== 'Cancelado');
  if (jaTemProcesso) {
    throw new Error('Este contacto ja tem um processo activo. Gerir apenas em Processos.');
  }

  const medico = await medicosRepository.findById(data.medico_id);
  if (!medico) throw new Error('Medico nao encontrado');

  if (!data.teste_id) {
    throw new Error('Teste e obrigatorio');
  }
  const testeId = data.teste_id;
  const teste = await testesRepository.findById(testeId);
  if (!teste) throw new Error('Teste nao encontrado');

  const empresaId = await resolveEmpresaId(data, data.medico_id);
  if (!empresaId) {
    throw new Error('Empresa e obrigatoria. Crie uma empresa em Administracao.');
  }

  if (data.status && !normalizeStatus(data.status)) {
    throw new Error(`Status invalido. Valores validos: ${STATUS_CANONICOS.join(', ')}`);
  }

  const workflowData = normalizeWorkflowPayload(data);
  const statusProcesso = normalizeStatus(data.status) || 'Agendado';
  const kitCodigo = workflowData.kit_codigo || null;

  if (workflowData.desconto_percentual !== undefined && (workflowData.desconto_percentual < 0 || workflowData.desconto_percentual > 100)) {
    throw new Error('Desconto percentual deve estar entre 0 e 100.');
  }

  if (workflowData.pagamento_data && !workflowData.recibo_numero) {
    throw new Error('Numero de recibo e obrigatorio ao marcar pagamento.');
  }

  if (statusExigeKit(statusProcesso) && !kitCodigo) {
    throw new Error('Codigo do kit e obrigatorio apos colheita.');
  }

  let numeroProcesso = workflowData.numero_processo || null;
  if (numeroProcesso) {
    const existente = await processosRepository.findByNumero(numeroProcesso);
    if (existente) throw new Error('Ja existe um processo com este numero.');
  } else {
    numeroProcesso = await processosRepository.generateNumeroProcesso();
  }

  if (kitCodigo) {
    const processoComKit = await processosRepository.findByKitCodigo(kitCodigo);
    if (processoComKit) {
      throw new Error('Ja existe um processo com este codigo de kit.');
    }
  }

  const kitId = await resolveKitId(kitCodigo);
  if (kitCodigo && !kitId) {
    throw new Error('Kit nao encontrado para o codigo informado.');
  }

  const clinicoSnapshot = buildClinicoSnapshotFromPaciente(data, paciente);

  const processo = await processosRepository.create({
    paciente_id: data.paciente_id,
    medico_id: data.medico_id,
    teste_id: testeId,
    empresa_id: empresaId,
    status_id: statusProcesso,
    kit_id: kitId,
    posto: workflowData.posto || null,
    posto_id: workflowData.posto_id || data.posto_id || null,
    data_entrada: data.data_entrada || new Date(),
    ...workflowData,
    data_colheita_prevista: clinicoSnapshot.data_colheita_prevista || workflowData.data_colheita_prevista || null,
    numero_processo: numeroProcesso,
  });

  await syncInformacaoClinica(processo.id, clinicoSnapshot);

  const colheitasService = require('./colheitas.service');
  await colheitasService.syncFromProcesso({
    processoId: processo.id,
    postoId: workflowData.posto_id || data.posto_id || null,
    dataPrevista: clinicoSnapshot.data_colheita_prevista || workflowData.data_colheita_prevista || null,
    dataEfetiva: workflowData.data_colheita || null,
    status: statusProcesso,
  });

  // Contacto convertido: limpar fase pre-processo para nao permitir segundo teste no mesmo registo.
  await pacientesRepository.update(data.paciente_id, {
    medico_id: null,
    teste_id: null,
    tipo_gravidez: null,
    onde_seguida: null,
    posto_colheita_id: null,
    data_colheita_prevista: null,
    notas_internas: null,
    estado_agendamento: null,
  });

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || empresaId,
      utilizador_id: user.id,
      acao: 'Criou processo',
      tabela: 'processos',
      registro_id: processo.id
    });
  }

  return attachInformacaoClinica(processo);
};

exports.update = async (id, data, user) => {
  const processo = await processosRepository.findById(id);
  if (!processo) throw new Error('Processo nao encontrado');

  if (user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para atualizar este processo');
  }

  if (data.status && !normalizeStatus(data.status)) {
    throw new Error(`Status invalido. Valores validos: ${STATUS_CANONICOS.join(', ')}`);
  }

  const workflowData = normalizeWorkflowPayload(data);
  const statusResultante = normalizeStatus(data.status) || processo.status_id || 'Agendado';

  if (data.status !== undefined) {
    assertTransicaoValida(processo.status_id, statusResultante);
  }
  const kitResultante = workflowData.kit_codigo !== undefined
    ? workflowData.kit_codigo
    : (processo.kit_codigo || null);

  if (workflowData.desconto_percentual !== undefined && (workflowData.desconto_percentual < 0 || workflowData.desconto_percentual > 100)) {
    throw new Error('Desconto percentual deve estar entre 0 e 100.');
  }

  if (statusExigeKit(statusResultante) && !kitResultante) {
    throw new Error('Codigo do kit e obrigatorio apos colheita.');
  }

  if (workflowData.numero_processo) {
    const existente = await processosRepository.findByNumero(workflowData.numero_processo);
    if (existente && existente.id !== id) throw new Error('Ja existe um processo com este numero.');
  }

  if (workflowData.kit_codigo) {
    const processoComKit = await processosRepository.findByKitCodigo(workflowData.kit_codigo);
    if (processoComKit && processoComKit.id !== id) {
      throw new Error('Ja existe um processo com este codigo de kit.');
    }
  }

  if (workflowData.pagamento_data && !workflowData.recibo_numero && !(processo.recibo_numero && workflowData.recibo_numero === undefined)) {
    throw new Error('Numero de recibo e obrigatorio ao marcar pagamento.');
  }

  if (data.medico_id) {
    const medico = await medicosRepository.findById(data.medico_id);
    if (!medico) throw new Error('Medico nao encontrado');
  }

  if (data.teste_id) {
    const teste = await testesRepository.findById(data.teste_id);
    if (!teste) throw new Error('Teste nao encontrado');
  }

  const updateData = {};
  if (data.status !== undefined) updateData.status_id = statusResultante;
  if (data.medico_id !== undefined) updateData.medico_id = data.medico_id;
  if (data.teste_id !== undefined) updateData.teste_id = data.teste_id;
  if (data.data_entrada !== undefined) updateData.data_entrada = data.data_entrada || null;
  if (workflowData.posto !== undefined) updateData.posto = workflowData.posto;
  if (workflowData.numero_processo !== undefined) updateData.numero_processo = workflowData.numero_processo;
  if (workflowData.observacoes !== undefined) updateData.observacoes = workflowData.observacoes;

  if (workflowData.kit_codigo !== undefined) {
    const kitId = await resolveKitId(workflowData.kit_codigo);
    if (workflowData.kit_codigo && !kitId) {
      throw new Error('Kit nao encontrado para o codigo informado.');
    }
    updateData.kit_id = kitId;
  }

  Object.assign(updateData, workflowData);

  await processosRepository.update(id, updateData);
  await syncInformacaoClinica(id, data);

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || processo.empresa_id,
      utilizador_id: user.id,
      acao: 'Atualizou processo',
      tabela: 'processos',
      registro_id: id
    });
  }

  return attachInformacaoClinica({ id, ...processo, ...updateData });
};

exports.delete = async (id, user) => {
  const processo = await processosRepository.findById(id);
  if (!processo) throw new Error('Processo nao encontrado');

  if (user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para deletar este processo');
  }

  await processosRepository.delete(id);

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || processo.empresa_id,
      utilizador_id: user.id,
      acao: 'Deletou processo',
      tabela: 'processos',
      registro_id: id
    });
  }

  return true;
};
