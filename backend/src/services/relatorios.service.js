const relatoriosRepository = require('../repositories/relatorios.repository');
const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const processosRepository = require('../repositories/processos.repository');
const logService = require('./log.service');
const { emit, EVENTS } = require('../events');
const { buildRelatorioClinicoMaternityHtml } = require('../templates/relatorio-clinico-maternity');

const RELATORIO_DESTINOS_VALIDOS = ['Nenhum', 'Medico', 'Utente', 'Ambos'];
const ESTADOS_ENVIO = ['Pendente', 'Enviado', 'Falha'];

const ensureProcesso = async (processoId, user) => {
  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');
  if (user && user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para aceder a este processo');
  }
  return processo;
};

const buildRelatorioHtml = (processo, anomalias) =>
  buildRelatorioClinicoMaternityHtml(processo, anomalias);

exports.getRelatorioHtml = async (processoId, user) => {
  const processo = await ensureProcesso(processoId, user);
  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  return buildRelatorioHtml(processo, anomalias);
};

exports.listRelatorios = async (processoId, user) => {
  await ensureProcesso(processoId, user);
  return relatoriosRepository.findByProcesso(processoId);
};

exports.gerarRelatorio = async (processoId, data, user) => {
  const processo = await ensureProcesso(processoId, user);

  if (!processo.data_resultado && processo.status_id !== 'Resultado Disponivel' && processo.status_id !== 'Validado') {
    throw new Error('So e possivel gerar relatorio apos o resultado estar disponivel.');
  }

  const pdfUrl = `/api/processos/${processoId}/relatorio/html`;
  const relatorio = await relatoriosRepository.create({
    processoId,
    template: data.template || 'maternity-maternit21',
    pdfUrl,
    observacoes: data.observacoes || null,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Gerou relatorio',
      tabela: 'processo_relatorios',
    });
  }

  const html = buildRelatorioHtml(
    processo,
    await resultadosGeneticosRepository.findByProcesso(processoId)
  );

  return { ...relatorio, html };
};

/**
 * Regista o envio do relatorio (medico/utente/ambos) e o estado do envio.
 */
exports.registarEnvio = async (processoId, data, user) => {
  const processo = await ensureProcesso(processoId, user);

  const destino = data.destino || 'Medico';
  if (!RELATORIO_DESTINOS_VALIDOS.includes(destino)) {
    throw new Error(`Destino invalido. Valores validos: ${RELATORIO_DESTINOS_VALIDOS.join(', ')}`);
  }

  const estado = data.estado_envio && ESTADOS_ENVIO.includes(data.estado_envio)
    ? data.estado_envio
    : 'Enviado';

  const relatorios = await relatoriosRepository.findByProcesso(processoId);
  const relatorioId = data.relatorio_id || (relatorios[0] && relatorios[0].id);
  if (!relatorioId) {
    throw new Error('Nao existe relatorio gerado para este processo.');
  }

  await relatoriosRepository.updateEstadoEnvio(relatorioId, estado, data.observacoes);

  await processosRepository.update(processoId, {
    relatorio_enviado_para: destino,
    data_envio_relatorio: new Date().toISOString().split('T')[0],
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: `Enviou relatorio (${destino})`,
      tabela: 'processo_relatorios',
    });
  }

  emit(EVENTS.RELATORIO_ENVIADO, {
    processo_id: processo.id,
    numero_processo: processo.numero_processo,
    destino,
    medico_email: processo.medico_email || null,
    utente_email: processo.paciente_email || null,
  });

  return { processo_id: processo.id, relatorio_id: relatorioId, destino, estado_envio: estado };
};
