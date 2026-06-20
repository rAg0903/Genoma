const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const processosRepository = require('../repositories/processos.repository');
const logService = require('./log.service');
const { emit, EVENTS } = require('../events');

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

const buildResumoAnomalias = (anomalias) =>
  anomalias
    .map((a) => {
      const prob = a.probabilidade ? ` (${a.probabilidade})` : '';
      return `${a.cromossoma}: ${a.resultado_valor}${prob}`;
    })
    .join('; ');

const ensureProcesso = async (processoId, user) => {
  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');
  if (user && user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para aceder a este processo');
  }
  return processo;
};

exports.getResultados = async (processoId, user) => {
  const processo = await ensureProcesso(processoId, user);
  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  return {
    processo_id: processo.id,
    numero_processo: processo.numero_processo,
    status: processo.status_id,
    resultado_tudo_ok: !!processo.resultado_tudo_ok,
    resultado_anomalias: processo.resultado_anomalias || '',
    data_resultado: processo.data_resultado || null,
    data_validacao: processo.data_validacao || null,
    relatorio_validado: !!processo.relatorio_validado,
    anomalias,
  };
};

/**
 * Registo de resultados no modelo "tudo OK por defeito": por omissao tudo esta
 * OK; o utilizador apenas assinala as anomalias detetadas. Avanca o processo
 * para "Resultado Disponivel".
 */
exports.registarResultados = async (processoId, data, user) => {
  const processo = await ensureProcesso(processoId, user);

  if (processo.status_id === 'Cancelado') {
    throw new Error('Nao e possivel registar resultados de um processo cancelado.');
  }

  const anomaliasInput = Array.isArray(data.anomalias) ? data.anomalias : [];
  const tudoOk = data.tudo_ok !== undefined ? !!data.tudo_ok : anomaliasInput.length === 0;

  let anomalias = [];
  if (!tudoOk) {
    if (anomaliasInput.length === 0) {
      throw new Error('Indique pelo menos uma anomalia ou marque o resultado como "tudo OK".');
    }
    anomalias = anomaliasInput.map(sanitizeAnomalia);
  }

  await resultadosGeneticosRepository.replaceForProcesso(processoId, anomalias);

  const dataResultado = data.data_resultado
    ? String(data.data_resultado).split('T')[0]
    : new Date().toISOString().split('T')[0];

  await processosRepository.update(processoId, {
    status_id: 'Resultado Disponivel',
    resultado_tudo_ok: tudoOk,
    resultado_anomalias: tudoOk ? null : buildResumoAnomalias(anomalias),
    data_resultado: dataResultado,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: tudoOk ? 'Registou resultado (tudo OK)' : 'Registou resultado com anomalias',
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
  const processo = await ensureProcesso(processoId, user);

  if (processo.status_id !== 'Resultado Disponivel') {
    throw new Error('So e possivel validar processos com resultado disponivel.');
  }

  await processosRepository.update(processoId, {
    status_id: 'Validado',
    relatorio_validado: true,
    data_validacao: data.data_validacao
      ? String(data.data_validacao).split('T')[0]
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

  return exports.getResultados(processoId, user);
};
