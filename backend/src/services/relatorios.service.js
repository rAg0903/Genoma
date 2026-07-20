const { buildRelatorioClinicoMaternityProposta1Html } = require('../templates/relatorio-clinico-maternity-proposta1');
const { buildRelatorioClinicoGenomaNiptHtml } = require('../templates/relatorio-clinico-genoma-nipt');
const { buildRelatorioClinicoMaternityHtml } = require('../templates/relatorio-clinico-maternity');

const relatoriosRepository = require('../repositories/relatorios.repository');
const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const processosRepository = require('../repositories/processos.repository');
const relatorioArquivoService = require('./relatorio-arquivo.service');
const { loadProcessoWithAccess, assertOperacionalWriteAllowed } = require('../utils/medico-access');
const logService = require('./log.service');
const configuracaoSistemaService = require('./configuracao-sistema.service');
const { emit, EVENTS } = require('../events');

const RELATORIO_DESTINOS_VALIDOS = ['Nenhum', 'Medico', 'Utente', 'Ambos'];
const ESTADOS_ENVIO = ['Pendente', 'Enviado', 'Falha'];

const TEMPLATE_BUILDERS = {
  'maternity-proposta1': buildRelatorioClinicoMaternityProposta1Html,
  'genoma-nipt': buildRelatorioClinicoGenomaNiptHtml,
  'maternity-maternit21': buildRelatorioClinicoMaternityHtml,
};

const DEFAULT_TEMPLATE = 'maternity-proposta1';

/** Estados em que o relatório clínico faz sentido (inclui dados importados sem data_resultado). */
const ESTADOS_COM_RELATORIO = new Set(['Resultado Disponivel', 'Validado', 'Faturado']);

const podeGerarRelatorio = (processo) =>
  !!processo.data_resultado || ESTADOS_COM_RELATORIO.has(processo.status_id);

const ensureProcesso = (processoId, user) => loadProcessoWithAccess(processoId, user);

const buildRelatorioHtml = async (processo, anomalias, template = DEFAULT_TEMPLATE) => {
  const resolvedTemplate = TEMPLATE_BUILDERS[template] ? template : DEFAULT_TEMPLATE;
  if (resolvedTemplate === 'genoma-nipt') {
    const clinica = await configuracaoSistemaService.resolveClinica(processo);
    return buildRelatorioClinicoGenomaNiptHtml(processo, anomalias, clinica);
  }
  return TEMPLATE_BUILDERS[resolvedTemplate](processo, anomalias);
};

exports.getRelatorioHtml = async (processoId, user, template) => {
  const processo = await ensureProcesso(processoId, user);
  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  return buildRelatorioHtml(processo, anomalias, template);
};

exports.listRelatorios = async (processoId, user) => {
  await ensureProcesso(processoId, user);
  return relatoriosRepository.findByProcesso(processoId);
};

exports.listRelatoriosAnexos = async (processoId, user) => {
  await ensureProcesso(processoId, user);
  return relatorioArquivoService.listarRelatoriosProcesso(processoId);
};

exports.gerarRelatorio = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
  const processo = await ensureProcesso(processoId, user);

  if (!podeGerarRelatorio(processo)) {
    throw new Error('So e possivel gerar relatorio apos o resultado estar disponivel.');
  }

  const template = data.template || DEFAULT_TEMPLATE;

  let arquivo;
  if (data.pdf_base64) {
    const pdfBytes = Buffer.from(String(data.pdf_base64), 'base64');
    if (!pdfBytes.length) throw new Error('PDF vazio ou invalido.');
    arquivo = await relatorioArquivoService.gravarPdfBuffer(processoId, pdfBytes, user, {
      template,
      origem: 'manual',
    });
  } else {
    arquivo = await relatorioArquivoService.gerarEGravar(processoId, user, {
      template,
      origem: 'manual',
    });
  }

  const html = await buildRelatorioHtml(
    processo,
    await resultadosGeneticosRepository.findByProcesso(processoId),
    template,
  );

  if (user && !arquivo.skipped) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Gerou relatorio',
      tabela: 'processo_relatorios',
    });
  }

  return {
    ...(arquivo.relatorio || {}),
    html,
    anexo: arquivo.anexo,
    skipped: !!arquivo.skipped,
    motivo: arquivo.motivo || null,
  };
};

/**
 * Regista o envio do relatorio (medico/utente/ambos) e o estado do envio.
 */
exports.registarEnvio = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
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

exports.DEFAULT_TEMPLATE = DEFAULT_TEMPLATE;
exports.TEMPLATE_BUILDERS = TEMPLATE_BUILDERS;
