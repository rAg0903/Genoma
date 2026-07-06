const colheitasRepository = require('../repositories/colheitas.repository');
const processosService = require('./processos.service');
const processosRepository = require('../repositories/processos.repository');
const testesRepository = require('../repositories/testes.repository');
const logService = require('./log.service');
const { emit, EVENTS } = require('../events');

const PERIODOS_VALIDOS = ['Manhã', 'Tarde', 'Noite'];

// Codificacao de cores do calendario (alinhada com o CRM antigo):
//   1 colheita  -> verde
//   2 colheitas -> amarelo
//   3-4+        -> vermelho (carga elevada)
const corDoDia = (total) => {
  if (total <= 0) return 'cinza';
  if (total === 1) return 'verde';
  if (total === 2) return 'amarelo';
  return 'vermelho';
};

const toDateString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.split('T')[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const mapAgendamento = (row) => ({
  id: row.id,
  processo_id: row.processo_id,
  numero_processo: row.numero_processo || '',
  processo_status: row.processo_status || '',
  paciente_nome: row.paciente_nome || '',
  posto_id: row.posto_id,
  posto_nome: row.posto_nome || '',
  kit_codigo: row.kit_codigo || '',
  data_prevista: toDateString(row.data_prevista),
  periodo: row.periodo || '',
  data_efetiva: row.data_efetiva ? new Date(row.data_efetiva).toISOString() : '',
});

exports.listAgendamentos = async (filters = {}) => {
  const rows = await colheitasRepository.findAll({
    from: filters.from || null,
    to: filters.to || null,
    posto_id: filters.posto_id || null,
  });
  return rows.map(mapAgendamento);
};

const COLHEITA_PROCESSO_STATUSES = new Set(['Agendado', 'Kit Reservado', 'Colheita Realizada']);

/**
 * Listagem operacional: colheitas registadas + processos com dados de colheita
 * sem registo na tabela (ex.: conversão directa contacto → processo).
 */
exports.listForReporting = async (user) => {
  const processosService = require('./processos.service');
  const [rows, processos] = await Promise.all([
    colheitasRepository.findAll({}),
    processosService.listAll(user),
  ]);

  const processoIds = new Set(rows.map((r) => r.processo_id).filter(Boolean));
  const extras = processos
    .filter((p) => {
      if (processoIds.has(p.id)) return false;
      const status = p.status || p.status_id || '';
      if (status === 'Cancelado') return false;
      return COLHEITA_PROCESSO_STATUSES.has(status)
        || p.data_colheita
        || p.data_colheita_prevista;
    })
    .map((p) => ({
      id: `proc-${p.id}`,
      processo_id: p.id,
      numero_processo: p.numero_processo || '',
      processo_status: p.status || p.status_id || '',
      paciente_nome: p.paciente_nome || '',
      posto_id: p.posto_id || null,
      posto_nome: p.posto || '',
      kit_codigo: p.kit_codigo || '',
      data_prevista: p.data_colheita_prevista || p.data_colheita || null,
      periodo: '',
      data_efetiva: p.data_colheita || null,
    }));

  return [...rows, ...extras].map(mapAgendamento);
};

exports.syncFromProcesso = async ({
  processoId,
  postoId = null,
  dataPrevista = null,
  dataEfetiva = null,
  status = null,
}) => {
  if (!processoId) return null;
  const hasColheitaData = !!(dataPrevista || dataEfetiva || COLHEITA_PROCESSO_STATUSES.has(status));
  if (!hasColheitaData) return null;

  const efetiva = dataEfetiva || (status === 'Colheita Realizada' ? dataPrevista : null);
  return colheitasRepository.insertSnapshotIfMissing({
    processoId,
    postoId,
    dataPrevista: dataPrevista || dataEfetiva || null,
    dataEfetiva: efetiva || null,
  });
};

exports.getCalendario = async ({ from, to } = {}) => {
  const rows = await colheitasRepository.getCalendar({ from, to });
  return rows.map((row) => {
    const total = Number(row.total || 0);
    return {
      dia: toDateString(row.dia),
      total,
      cor: corDoDia(total),
    };
  });
};

/**
 * Agenda uma colheita: verifica stock de kits, reserva um kit, cria o processo
 * (estado "Kit Reservado") e regista a colheita prevista.
 */
exports.createAgendamento = async (data, user) => {
  if (!data.paciente_id || !data.medico_id) {
    throw new Error('Paciente e medico sao obrigatorios');
  }
  if (!data.teste_id) {
    throw new Error('Teste e obrigatorio');
  }
  if (!data.posto_id) {
    throw new Error('Posto de colheita e obrigatorio');
  }
  if (!data.data_prevista) {
    throw new Error('Data prevista da colheita e obrigatoria');
  }
  if (data.periodo && !PERIODOS_VALIDOS.includes(data.periodo)) {
    throw new Error(`Periodo invalido. Valores validos: ${PERIODOS_VALIDOS.join(', ')}`);
  }

  const teste = await testesRepository.findById(data.teste_id);
  if (!teste) throw new Error('Teste nao encontrado');

  // Regra de negocio: sem kit em stock, nao ha colheita.
  const disponiveis = await colheitasRepository.countKitsDisponiveis({ tipoKitId: data.teste_id });
  if (disponiveis <= 0) {
    throw new Error('Sem kits disponiveis em stock para este teste. Nao e possivel agendar.');
  }

  const kit = await colheitasRepository.findAvailableKit({
    tipoKitId: data.teste_id,
    postoId: data.posto_id,
  });
  if (!kit) {
    throw new Error('Nao foi possivel reservar um kit disponivel para este teste.');
  }

  const posto = await colheitasRepository.findPostoById(data.posto_id);

  // Cria o processo no estado inicial "Agendado"; a reserva do kit movimenta-o
  // para "Kit Reservado".
  const processo = await processosService.create(
    {
      paciente_id: data.paciente_id,
      medico_id: data.medico_id,
      teste_id: data.teste_id,
      empresa_id: data.empresa_id,
      status: 'Agendado',
      posto: posto ? posto.nome : (data.posto || null),
      observacoes: data.observacoes,
    },
    user
  );

  const agendamento = await colheitasRepository.reserveKitAndSchedule({
    processoId: processo.id,
    kitId: kit.id,
    postoId: data.posto_id,
    postoNome: posto ? posto.nome : (data.posto || null),
    dataPrevista: toDateString(data.data_prevista),
    periodo: data.periodo || null,
  });

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || processo.empresa_id,
      utilizador_id: user.id,
      acao: 'Agendou colheita',
      tabela: 'colheitas',
      registro_id: agendamento.id,
    });
  }

  const criado = await colheitasRepository.findById(agendamento.id);
  const resultado = mapAgendamento(criado);

  emit(EVENTS.AGENDAMENTO_CRIADO, {
    processo_id: resultado.processo_id,
    numero_processo: resultado.numero_processo,
    posto_nome: resultado.posto_nome,
    data_prevista: resultado.data_prevista,
    kit_codigo: resultado.kit_codigo,
  });

  return resultado;
};

/**
 * Regista a colheita efetiva (kit consumido, processo -> "Colheita Realizada").
 */
exports.registarColheita = async (id, data, user) => {
  const colheita = await colheitasRepository.findById(id);
  if (!colheita) throw new Error('Agendamento nao encontrado');
  if (colheita.data_efetiva) {
    throw new Error('Esta colheita ja foi registada.');
  }

  const dataEfetiva = data.data_efetiva || new Date().toISOString();

  await colheitasRepository.registarColheita({
    colheitaId: id,
    processoId: colheita.processo_id,
    kitId: colheita.kit_id,
    dataEfetiva,
    postoId: colheita.posto_id,
    laboratorioFinalId: data.laboratorio_final_id || null,
    utilizadorId: user?.id || null,
  });

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || null,
      utilizador_id: user.id,
      acao: 'Registou colheita',
      tabela: 'colheitas',
      registro_id: id,
    });
  }

  const atualizado = await colheitasRepository.findById(id);
  const resultado = mapAgendamento(atualizado);

  emit(EVENTS.COLHEITA_REGISTADA, {
    processo_id: resultado.processo_id,
    numero_processo: resultado.numero_processo,
    kit_codigo: resultado.kit_codigo,
  });

  return resultado;
};

exports.previewLaboratorioFinal = async ({ processo_id, posto_id, laboratorio_final_id }) =>
  require('./laboratorio-final.service').previewLaboratorioFinal({
    processoId: processo_id,
    postoId: posto_id,
    overrideLaboratorioId: laboratorio_final_id,
  });

exports.cancelAgendamento = async (id, user) => {
  const colheita = await colheitasRepository.findById(id);
  if (!colheita) throw new Error('Agendamento nao encontrado');
  if (colheita.data_efetiva) {
    throw new Error('Nao e possivel cancelar uma colheita ja realizada.');
  }

  await colheitasRepository.cancelAgendamento({
    colheitaId: id,
    processoId: colheita.processo_id,
    kitId: colheita.kit_id,
  });

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id || null,
      utilizador_id: user.id,
      acao: 'Cancelou agendamento',
      tabela: 'colheitas',
      registro_id: id,
    });
  }

  return true;
};
