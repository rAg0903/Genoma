const processosRepository = require('../repositories/processos.repository');
const pacientesRepository = require('../repositories/pacientes.repository');
const medicosRepository = require('../repositories/medicos.repository');
const testesRepository = require('../repositories/testes.repository');
const empresasRepository = require('../repositories/empresas.repository');
const stocksRepository = require('../repositories/stocks.repository');
const informacaoClinicaRepository = require('../repositories/informacao_clinica.repository');
const colheitasRepository = require('../repositories/colheitas.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const logService = require('./log.service');
const motivosAnulacaoService = require('./motivos_anulacao.service');
const pacientesService = require('./pacientes.service');
const { isMedicoUser, assertPacienteAccess } = require('../utils/medico-access');
const { formatCalendarDate } = require('../utils/calendar-dates');

const PROCESSO_DATE_FIELDS = [
  'data_entrada',
  'data_colheita',
  'data_colheita_prevista',
  'data_envio_laboratorio',
  'data_chegada_laboratorio',
  'data_resultado',
  'data_validacao',
  'data_envio_relatorio',
  'fatura_data_emissao',
  'pagamento_data',
  'fatura_envio_email',
  'fatura_envio_sms',
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

/** Campos de colheita copiados do contacto — não devem ser apagados por updates parciais. */
const COLHEITA_SNAPSHOT_FIELDS = new Set(['posto', 'posto_id', 'data_colheita', 'data_colheita_prevista']);

const hasColheitaValue = (value) => value != null && String(value).trim() !== '';

const mergeColheitaIntoProcesso = (processo, colheita) => {
  if (!processo) return processo;
  const merged = { ...processo };
  if (colheita) {
    if (!hasColheitaValue(merged.posto_id) && colheita.posto_id) merged.posto_id = colheita.posto_id;
    if (!hasColheitaValue(merged.posto) && colheita.posto_nome) merged.posto = colheita.posto_nome;
    if (!hasColheitaValue(merged.data_colheita_prevista) && colheita.data_prevista) {
      merged.data_colheita_prevista = colheita.data_prevista;
    }
    if (!hasColheitaValue(merged.data_colheita) && colheita.data_efetiva) {
      merged.data_colheita = colheita.data_efetiva;
    }
  }
  return mapProcessoResponse(merged);
};

const enrichProcessosColheita = async (rows) => {
  if (!rows?.length) return rows || [];
  const snapshots = await colheitasRepository.findSnapshotsByProcessoIds(rows.map((r) => r.id));
  const byProcesso = new Map(snapshots.map((s) => [s.processo_id, s]));
  return rows.map((row) => mergeColheitaIntoProcesso(row, byProcesso.get(row.id)));
};

const attachProcessoResponse = async (processo) => {
  if (!processo) return processo;
  const [withColheita] = await enrichProcessosColheita([processo]);
  return attachInformacaoClinica(withColheita);
};

const attachProcessosResponse = async (rows) => {
  const enriched = await enrichProcessosColheita(rows);
  return Promise.all(enriched.map((row) => attachInformacaoClinica(row)));
};

// Maquina de estados do Processo. Define para cada estado os estados de destino
// validos. Cancelado e atingivel a partir de qualquer estado nao-terminal.
const TRANSICOES_VALIDAS = {
  'Agendado': ['Kit Reservado', 'Cancelado'],
  'Kit Reservado': ['Colheita Realizada', 'Agendado', 'Cancelado'],
  'Colheita Realizada': ['Em Analise', 'Cancelado'],
  'Enviado Laboratorio': ['Resultado Disponivel', 'Cancelado'],
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

const ESTADOS_TERMINAIS = ['Faturado', 'Cancelado'];

const resolveProcessoStatus = (processo) =>
  processo?.status_id || processo?.status || null;

const isProcessoAtivo = (processo) => {
  const status = resolveProcessoStatus(processo);
  return !!status && !ESTADOS_TERMINAIS.includes(status);
};

exports.isProcessoAtivo = isProcessoAtivo;

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

const resolveKitCodigoProcesso = (processo, workflowKit) => {
  if (workflowKit !== undefined) {
    const normalized = normalizeStringOrNull(workflowKit);
    if (normalized) return normalized;
  }
  const kit = processo.kit_codigo && String(processo.kit_codigo).trim();
  if (kit) return kit;
  const numero = processo.numero_processo && String(processo.numero_processo).trim();
  return numero || null;
};

const normalizeWorkflowPayload = (data) => {
  const normalized = {};

  if (data.numero_processo !== undefined) normalized.numero_processo = normalizeStringOrNull(data.numero_processo);
  if (data.posto !== undefined) normalized.posto = normalizeStringOrNull(data.posto);
  if (data.posto_id !== undefined) normalized.posto_id = normalizeStringOrNull(data.posto_id);
  if (data.kit_codigo !== undefined) normalized.kit_codigo = normalizeStringOrNull(data.kit_codigo);
  if (data.data_colheita !== undefined) normalized.data_colheita = normalizeStringOrNull(data.data_colheita);
  if (data.data_colheita_prevista !== undefined) normalized.data_colheita_prevista = normalizeStringOrNull(data.data_colheita_prevista);
  if (data.data_envio_laboratorio !== undefined) normalized.data_envio_laboratorio = normalizeStringOrNull(data.data_envio_laboratorio);
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
  if (data.entidade_multibanco !== undefined) normalized.entidade_multibanco = normalizeStringOrNull(data.entidade_multibanco);
  if (data.referencia_multibanco !== undefined) normalized.referencia_multibanco = normalizeStringOrNull(data.referencia_multibanco);
  if (data.nao_gera_comissao !== undefined) normalized.nao_gera_comissao = !!data.nao_gera_comissao;
  if (data.fatura_envio_email !== undefined) normalized.fatura_envio_email = normalizeStringOrNull(data.fatura_envio_email);
  if (data.fatura_envio_sms !== undefined) normalized.fatura_envio_sms = normalizeStringOrNull(data.fatura_envio_sms);

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
    origem_conceicao: info.origem_conceicao || null,
    quer_saber_sexo: !!info.quer_saber_sexo,
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
    || data.origem_conceicao !== undefined
    || data.quer_saber_sexo !== undefined
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
  origem_conceicao: data.origem_conceicao ?? paciente.origem_conceicao ?? null,
  quer_saber_sexo: data.quer_saber_sexo ?? paciente.quer_saber_sexo ?? false,
  onde_seguida: data.onde_seguida ?? paciente.onde_seguida ?? null,
  gestacao_semanas_registo: data.gestacao_semanas_registo ?? paciente.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: data.gestacao_dias_registo ?? paciente.gestacao_dias_registo ?? null,
  gestacao_registada_em: data.gestacao_registada_em ?? paciente.gestacao_registada_em ?? null,
  data_colheita_prevista: data.data_colheita_prevista ?? paciente.data_colheita_prevista ?? null,
});

const buildFaturacaoFromPaciente = (paciente) => {
  const valorBase = Number(paciente.valor_base) || 0;
  const desconto = Number(paciente.desconto_percentual) || 0;
  const valorFinal = Number(paciente.valor_final) || Number((valorBase * (1 - desconto / 100)).toFixed(2));
  const faturaNumero = paciente.fatura_numero || null;
  const faturaData = paciente.fatura_data_emissao || null;
  return {
    valor_base: valorBase,
    desconto_percentual: desconto,
    valor_final: valorFinal,
    fatura_emitida: !!(faturaNumero && faturaData) || !!paciente.fatura_emitida,
    fatura_numero: faturaNumero,
    fatura_data_emissao: faturaData,
    pagamento_data: paciente.pagamento_data || null,
    recibo_numero: paciente.recibo_numero || null,
    pago: !!paciente.pago,
    entidade_multibanco: paciente.entidade_multibanco || null,
    referencia_multibanco: paciente.referencia_multibanco || null,
    nao_gera_comissao: !!paciente.nao_gera_comissao,
    fatura_envio_email: paciente.fatura_envio_email || null,
    fatura_envio_sms: paciente.fatura_envio_sms || null,
  };
};

const mergeFaturacaoFromPaciente = (workflowData, paciente) => {
  const fromPaciente = buildFaturacaoFromPaciente(paciente);
  const merged = { ...workflowData };
  for (const [key, value] of Object.entries(fromPaciente)) {
    if (merged[key] === undefined && value !== null && value !== undefined && value !== '' && value !== 0) {
      merged[key] = value;
    }
  }
  if (merged.valor_base === undefined && fromPaciente.valor_base) merged.valor_base = fromPaciente.valor_base;
  if (merged.desconto_percentual === undefined) merged.desconto_percentual = fromPaciente.desconto_percentual;
  if (merged.valor_final === undefined && fromPaciente.valor_final) merged.valor_final = fromPaciente.valor_final;
  if (merged.fatura_numero === undefined && fromPaciente.fatura_numero) merged.fatura_numero = fromPaciente.fatura_numero;
  if (merged.fatura_data_emissao === undefined && fromPaciente.fatura_data_emissao) {
    merged.fatura_data_emissao = fromPaciente.fatura_data_emissao;
  }
  if (merged.fatura_emitida === undefined && fromPaciente.fatura_emitida) merged.fatura_emitida = fromPaciente.fatura_emitida;
  if (merged.recibo_numero === undefined && fromPaciente.recibo_numero) merged.recibo_numero = fromPaciente.recibo_numero;
  if (merged.pagamento_data === undefined && fromPaciente.pagamento_data) merged.pagamento_data = fromPaciente.pagamento_data;
  if (merged.pago === undefined && fromPaciente.pago) merged.pago = fromPaciente.pago;
  if (merged.entidade_multibanco === undefined && fromPaciente.entidade_multibanco) {
    merged.entidade_multibanco = fromPaciente.entidade_multibanco;
  }
  if (merged.referencia_multibanco === undefined && fromPaciente.referencia_multibanco) {
    merged.referencia_multibanco = fromPaciente.referencia_multibanco;
  }
  if (merged.nao_gera_comissao === undefined && fromPaciente.nao_gera_comissao) {
    merged.nao_gera_comissao = fromPaciente.nao_gera_comissao;
  }
  if (merged.fatura_envio_email === undefined && fromPaciente.fatura_envio_email) {
    merged.fatura_envio_email = fromPaciente.fatura_envio_email;
  }
  if (merged.fatura_envio_sms === undefined && fromPaciente.fatura_envio_sms) {
    merged.fatura_envio_sms = fromPaciente.fatura_envio_sms;
  }
  return merged;
};

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
  return attachProcessosResponse(rows);
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

  return attachProcessoResponse(processo);
};

exports.listByPaciente = async (pacienteId, user) => {
  const paciente = await pacientesRepository.findById(pacienteId);
  if (!paciente) throw new Error('Paciente nao encontrado');
  await assertPacienteAccess(paciente, user);

  const rows = await processosRepository.findByPaciente(pacienteId);
  if (await isMedicoUser(user)) {
    const ownRows = rows.filter((row) => row.medico_id === user.id);
    return attachProcessosResponse(ownRows);
  }
  return attachProcessosResponse(rows);
};

exports.create = async (data, user) => {
  if (!data.paciente_id || !data.medico_id) {
    throw new Error('Paciente e medico sao obrigatorios');
  }

  const paciente = await pacientesRepository.findById(data.paciente_id);
  if (!paciente) throw new Error('Paciente nao encontrado');

  const processosExistentes = await processosRepository.findByPaciente(data.paciente_id);
  const jaTemProcessoAtivo = processosExistentes.some((p) => isProcessoAtivo(p));
  if (jaTemProcessoAtivo) {
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

  const workflowData = mergeFaturacaoFromPaciente(normalizeWorkflowPayload(data), paciente);
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

  let numeroProcesso = workflowData.numero_processo || kitCodigo || null;
  if (!numeroProcesso) {
    throw new Error('Numero do processo (codigo do kit) e obrigatorio.');
  }
  const existenteNumero = await processosRepository.findByNumero(numeroProcesso);
  if (existenteNumero) throw new Error('Ja existe um processo com este numero.');

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

  if (statusProcesso === 'Em Analise' && !processo.data_envio_laboratorio) {
    const hoje = formatCalendarDate(new Date());
    await processosRepository.update(processo.id, {
      data_envio_laboratorio: workflowData.data_envio_laboratorio || workflowData.data_colheita || hoje,
    });
  }

  const created = await processosRepository.findById(processo.id);

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
    origem_conceicao: null,
    quer_saber_sexo: false,
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

  return attachProcessoResponse(created || processo);
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
  const statusAtual = normalizeStatus(processo.status_id) || processo.status_id;
  const statusResultante = normalizeStatus(data.status) || statusAtual || 'Agendado';

  if (data.status !== undefined && statusAtual !== statusResultante) {
    assertTransicaoValida(statusAtual, statusResultante);
  }
  const kitResultante = resolveKitCodigoProcesso(processo, workflowData.kit_codigo);

  if (workflowData.desconto_percentual !== undefined && (workflowData.desconto_percentual < 0 || workflowData.desconto_percentual > 100)) {
    throw new Error('Desconto percentual deve estar entre 0 e 100.');
  }

  if (statusExigeKit(statusResultante) && !kitResultante && !processo.kit_id) {
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

  let motivoAnulacao = null;
  if (statusResultante === 'Cancelado') {
    const motivoId = data.motivo_anulacao_id !== undefined
      ? data.motivo_anulacao_id
      : processo.motivo_anulacao_id;
    motivoAnulacao = await motivosAnulacaoService.assertMotivoParaContexto(motivoId, 'processo');
  }

  const updateData = {};
  if (data.status !== undefined && statusAtual !== statusResultante) updateData.status_id = statusResultante;
  if (data.medico_id !== undefined) updateData.medico_id = data.medico_id;
  if (data.teste_id !== undefined) updateData.teste_id = data.teste_id;
  if (data.data_entrada !== undefined) updateData.data_entrada = data.data_entrada || null;
  if (workflowData.posto !== undefined) {
    if (hasColheitaValue(workflowData.posto) || !hasColheitaValue(processo.posto)) {
      updateData.posto = workflowData.posto;
    }
  }
  if (workflowData.numero_processo) updateData.numero_processo = workflowData.numero_processo;
  if (workflowData.observacoes !== undefined) updateData.observacoes = workflowData.observacoes;

  if (statusResultante === 'Cancelado') {
    updateData.motivo_anulacao_id = motivoAnulacao.id;
    updateData.data_anulacao = data.data_anulacao || formatCalendarDate(new Date());
  } else if (data.status !== undefined && processo.status_id === 'Cancelado') {
    updateData.motivo_anulacao_id = null;
    updateData.data_anulacao = null;
  }

  if (workflowData.kit_codigo !== undefined) {
    const kitId = await resolveKitId(workflowData.kit_codigo);
    if (workflowData.kit_codigo && !kitId) {
      throw new Error('Kit nao encontrado para o codigo informado.');
    }
    updateData.kit_id = kitId;
  } else if (!processo.kit_id && kitResultante) {
    const kitId = await resolveKitId(kitResultante);
    if (kitId) updateData.kit_id = kitId;
  }

  const workflowDbFields = [
    'data_colheita', 'data_colheita_prevista', 'data_envio_laboratorio', 'data_chegada_laboratorio', 'data_resultado',
    'data_validacao', 'data_envio_relatorio', 'responsavel_fluxo', 'relatorio_validado',
    'relatorio_enviado_para', 'resultado_tudo_ok', 'resultado_anomalias', 'fracao_fetal',
    'fatura_emitida', 'fatura_numero', 'fatura_data_emissao', 'valor_base', 'desconto_percentual',
    'valor_final', 'pagamento_data', 'recibo_numero', 'pago',
    'entidade_multibanco', 'referencia_multibanco', 'nao_gera_comissao',
    'fatura_envio_email', 'fatura_envio_sms', 'posto_id',
  ];
  for (const key of workflowDbFields) {
    if (workflowData[key] === undefined) continue;
    if (COLHEITA_SNAPSHOT_FIELDS.has(key)
      && !hasColheitaValue(workflowData[key])
      && hasColheitaValue(processo[key])) {
      continue;
    }
    updateData[key] = workflowData[key];
  }

  if (data.status !== undefined && statusAtual !== statusResultante) {
    const hoje = formatCalendarDate(new Date());
    if (statusResultante === 'Em Analise'
      && !processo.data_envio_laboratorio
      && updateData.data_envio_laboratorio === undefined) {
      updateData.data_envio_laboratorio = hoje;
    }
    if (statusResultante === 'Enviado Laboratorio'
      && !processo.data_chegada_laboratorio
      && updateData.data_chegada_laboratorio === undefined) {
      updateData.data_chegada_laboratorio = hoje;
    }
    if (statusResultante === 'Enviado Laboratorio'
      && !processo.data_envio_laboratorio
      && updateData.data_envio_laboratorio === undefined) {
      updateData.data_envio_laboratorio = updateData.data_chegada_laboratorio || hoje;
    }
    if (statusResultante === 'Colheita Realizada'
      && !processo.data_colheita
      && updateData.data_colheita === undefined) {
      updateData.data_colheita = formatCalendarDate(new Date());
    }
    if (statusResultante === 'Resultado Disponivel'
      && !processo.data_resultado
      && updateData.data_resultado === undefined) {
      updateData.data_resultado = formatCalendarDate(new Date());
    }
    if (statusResultante === 'Validado'
      && !processo.data_validacao
      && updateData.data_validacao === undefined) {
      updateData.data_validacao = formatCalendarDate(new Date());
    }
    if ((statusResultante === 'Faturado' || statusResultante === 'Cancelado') && !processo.data_conclusao) {
      updateData.data_conclusao = statusResultante === 'Cancelado'
        ? (updateData.data_anulacao || formatCalendarDate(new Date()))
        : (updateData.fatura_data_emissao || workflowData.fatura_data_emissao || formatCalendarDate(new Date()));
    }
  }

  const numeroAtual = processo.numero_processo && String(processo.numero_processo).trim();
  if (!numeroAtual && !updateData.numero_processo) {
    const kitNumero = kitResultante && String(kitResultante).trim();
    if (kitNumero) {
      updateData.numero_processo = kitNumero;
    } else if (statusExigeKit(statusResultante) && !processo.kit_id) {
      throw new Error('Processo sem codigo de kit associado.');
    }
  }

  await processosRepository.update(id, updateData);
  await syncInformacaoClinica(id, data);

  if (statusResultante === 'Cancelado' && motivoAnulacao?.reabre_contacto) {
    await pacientesService.resetParaNovaColheita(processo.paciente_id, user);
  }

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || processo.empresa_id,
      utilizador_id: user.id,
      acao: 'Atualizou processo',
      tabela: 'processos',
      registro_id: id
    });
  }

  const updated = await processosRepository.findById(id);
  return attachProcessoResponse(updated);
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
