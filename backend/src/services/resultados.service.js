const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const processosRepository = require('../repositories/processos.repository');
const logService = require('./log.service');
const { loadProcessoWithAccess, assertOperacionalWriteAllowed } = require('../utils/medico-access');
const { emit, EVENTS } = require('../events');
const {
  cromossomasAnalisados,
  inicializarNegativo,
  parseResultadosJson,
  serializarResultados,
  derivarTudoOk,
  resultadosParaAnomalias,
  buildResumoAnomalias,
  anomaliasParaResultados,
  normalizarResultado,
} = require('../utils/cromossoma-opcoes');

const TIPOS_RESULTADO = ['Cromossoma', 'Sexual'];

const sanitizeAnomalia = (raw) => {
  if (!raw || !raw.cromossoma) {
    throw new Error('Cada anomalia precisa de identificar o cromossoma.');
  }
  const tipo = raw.tipo_resultado && TIPOS_RESULTADO.includes(raw.tipo_resultado)
    ? raw.tipo_resultado
    : 'Cromossoma';
  return {
    cromossoma: String(raw.cromossoma).trim(),
    resultado_valor: raw.resultado_valor ? String(raw.resultado_valor).trim() : 'Detectado',
    probabilidade: raw.probabilidade ? String(raw.probabilidade).trim() : null,
    tipo_resultado: tipo,
  };
};

const ensureProcesso = (processoId, user) => loadProcessoWithAccess(processoId, user);

const buildResultadoPayload = (processo, anomaliasDb = []) => {
  const analisados = cromossomasAnalisados(processo);
  let resultados = parseResultadosJson(processo.resultados_cromossomas);

  if (Object.keys(resultados).length === 0 && anomaliasDb.length > 0) {
    resultados = anomaliasParaResultados(anomaliasDb, analisados);
  } else if (Object.keys(resultados).length === 0) {
    resultados = inicializarNegativo(analisados);
  }

  return {
    processo_id: processo.id,
    numero_processo: processo.numero_processo,
    status: processo.status_id,
    resultado_tudo_ok: !!processo.resultado_tudo_ok,
    resultado_anomalias: processo.resultado_anomalias || '',
    data_resultado: processo.data_resultado || null,
    data_validacao: processo.data_validacao || null,
    relatorio_validado: !!processo.relatorio_validado,
    anomalias: anomaliasDb,
    cromossomas_analisados: analisados,
    resultados_cromossomas: resultados,
    sem_anomalias: derivarTudoOk(resultados, analisados, !!processo.sugerir_repeticao),
    sugerir_repeticao: !!processo.sugerir_repeticao,
    fracao_fetal: processo.fracao_fetal || '',
    cromossomas_sexuais: processo.cromossomas_sexuais || '',
    resultado_cromossomas_sexuais: processo.resultado_cromossomas_sexuais || '',
    id_amostra: processo.id_amostra || '',
    data_envio_laboratorio: processo.data_envio_laboratorio || null,
    data_recepcao_laboratorio: processo.data_chegada_laboratorio || null,
    data_relatorio_laboratorio: processo.data_relatorio_laboratorio || null,
    teste_cromossomas: processo.teste_cromossomas || null,
    incluir_fracao_fetal: processo.incluir_fracao_fetal !== 0 && processo.incluir_fracao_fetal !== false,
    determinacao_sexo_fetal: !!processo.determinacao_sexo_fetal,
  };
};

exports.getResultados = async (processoId, user) => {
  const processo = await ensureProcesso(processoId, user);
  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  return buildResultadoPayload(processo, anomalias);
};

const normalizeDateField = (value) => (value ? String(value).split('T')[0] : null);

/**
 * Registo de resultados com grelha NIPT (C1–C23).
 * Mantém compatibilidade com resultado_tudo_ok + resultados_geneticos.
 */
exports.registarResultados = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
  const processo = await ensureProcesso(processoId, user);

  if (processo.status_id === 'Cancelado') {
    throw new Error('Nao e possivel registar resultados de um processo cancelado.');
  }

  const analisados = cromossomasAnalisados(processo);
  const sugerirRepeticao = !!data.sugerir_repeticao;

  let resultados = {};
  if (data.resultados_cromossomas && typeof data.resultados_cromossomas === 'object') {
    for (const [key, value] of Object.entries(data.resultados_cromossomas)) {
      const n = parseInt(key, 10);
      if (analisados.includes(n)) {
        resultados[n] = normalizarResultado(value);
      }
    }
  } else if (Array.isArray(data.anomalias)) {
    resultados = anomaliasParaResultados(data.anomalias.map(sanitizeAnomalia), analisados);
  } else {
    resultados = inicializarNegativo(analisados);
  }

  for (const n of analisados) {
    if (resultados[n] === undefined) resultados[n] = normalizarResultado('Negativo');
  }

  const semAnomalias = data.sem_anomalias !== undefined
    ? !!data.sem_anomalias
    : derivarTudoOk(resultados, analisados, sugerirRepeticao);

  if (semAnomalias && !sugerirRepeticao) {
    resultados = inicializarNegativo(analisados);
  }

  const extras = {
    cromossomas_sexuais: data.cromossomas_sexuais || null,
    resultado_cromossomas_sexuais: data.resultado_cromossomas_sexuais || null,
  };

  const anomalias = semAnomalias && !sugerirRepeticao
    ? []
    : resultadosParaAnomalias(resultados, analisados, extras);

  if (!semAnomalias && !sugerirRepeticao && anomalias.length === 0) {
    throw new Error('Indique pelo menos um resultado alterado ou marque «Sem anomalias».');
  }

  const tudoOk = derivarTudoOk(resultados, analisados, sugerirRepeticao);

  await resultadosGeneticosRepository.replaceForProcesso(processoId, anomalias);

  const dataResultado = data.data_resultado
    ? normalizeDateField(data.data_resultado)
    : new Date().toISOString().split('T')[0];

  await processosRepository.update(processoId, {
    status_id: 'Resultado Disponivel',
    resultado_tudo_ok: tudoOk,
    resultado_anomalias: tudoOk ? null : buildResumoAnomalias(anomalias),
    resultados_cromossomas: serializarResultados(resultados),
    sugerir_repeticao: sugerirRepeticao ? 1 : 0,
    fracao_fetal: data.fracao_fetal !== undefined ? (data.fracao_fetal || null) : undefined,
    cromossomas_sexuais: data.cromossomas_sexuais !== undefined ? (data.cromossomas_sexuais || null) : undefined,
    resultado_cromossomas_sexuais: data.resultado_cromossomas_sexuais !== undefined
      ? (data.resultado_cromossomas_sexuais || null)
      : undefined,
    id_amostra: data.id_amostra !== undefined ? (data.id_amostra || null) : undefined,
    data_envio_laboratorio: data.data_envio_laboratorio !== undefined
      ? normalizeDateField(data.data_envio_laboratorio)
      : undefined,
    data_chegada_laboratorio: data.data_recepcao_laboratorio !== undefined
      ? normalizeDateField(data.data_recepcao_laboratorio)
      : undefined,
    data_relatorio_laboratorio: data.data_relatorio_laboratorio !== undefined
      ? normalizeDateField(data.data_relatorio_laboratorio)
      : undefined,
    data_resultado: dataResultado,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: tudoOk ? 'Registou resultado (sem anomalias)' : 'Registou resultado com alterações',
      tabela: 'resultados_geneticos',
    });
  }

  emit(EVENTS.RESULTADO_DISPONIVEL, { processo_id: processoId, tudo_ok: tudoOk });

  return exports.getResultados(processoId, user);
};

/**
 * Validacao clinica do resultado. Avanca o processo para "Validado".
 */
exports.validarResultado = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
  const processo = await ensureProcesso(processoId, user);

  if (processo.status_id !== 'Resultado Disponivel') {
    throw new Error('So e possivel validar processos com resultado disponivel.');
  }

  await processosRepository.update(processoId, {
    status_id: 'Validado',
    relatorio_validado: true,
    data_validacao: data.data_validacao
      ? normalizeDateField(data.data_validacao)
      : new Date().toISOString().split('T')[0],
    responsavel_fluxo: data.responsavel_fluxo || processo.responsavel_fluxo || null,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Validou resultado',
      tabela: 'processos',
    });
  }

  emit(EVENTS.RESULTADO_VALIDADO, { processo_id: processoId });

  let relatorioArquivo = null;
  try {
    const relatorioArquivoService = require('./relatorio-arquivo.service');
    relatorioArquivo = await relatorioArquivoService.gerarEGravar(processoId, user, {
      origem: 'validacao',
      template: 'maternity-proposta1',
    });
  } catch (err) {
    console.warn('[resultados] Falha ao auto-gerar relatório PDF:', err.message);
  }

  const resultados = await exports.getResultados(processoId, user);
  return { ...resultados, relatorio_arquivo: relatorioArquivo };
};
