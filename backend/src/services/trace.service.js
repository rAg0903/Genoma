const traceRepository = require('../repositories/trace.repository');

const TIPOS_VALIDOS = ['lote', 'kit', 'processo', 'resultado'];

/**
 * Rastreabilidade bidirecional Lote <-> Kit <-> Processo <-> Resultado.
 * Dado um ponto de entrada (tipo + id), reconstroi a cadeia completa e uma
 * linha temporal unificada (movimentos do kit + marcos do processo).
 */
exports.getTrace = async (tipo, id) => {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`Tipo de rastreio invalido. Validos: ${TIPOS_VALIDOS.join(', ')}`);
  }
  if (!id) throw new Error('Identificador obrigatorio para rastreio');

  let kit = null;
  let lote = null;
  let processo = null;

  if (tipo === 'kit') {
    kit = await traceRepository.kitById(id);
    if (!kit) throw new Error('Kit nao encontrado');
    processo = await traceRepository.processoByKitId(kit.id);
  } else if (tipo === 'processo' || tipo === 'resultado') {
    processo = await traceRepository.processoById(id);
    if (!processo) throw new Error('Processo nao encontrado');
    if (processo.kit_id) kit = await traceRepository.kitById(processo.kit_id);
  } else if (tipo === 'lote') {
    lote = await traceRepository.loteById(id);
    if (!lote) throw new Error('Lote nao encontrado');
  }

  if (kit && kit.lote_id && !lote) {
    lote = await traceRepository.loteById(kit.lote_id);
  }

  const cadeia = [];
  if (lote) cadeia.push({ tipo: 'lote', id: lote.id, label: lote.codigo_lote || 'Lote' });
  if (kit) cadeia.push({ tipo: 'kit', id: kit.id, label: kit.codigo_barras || 'Kit', sublabel: kit.status });
  if (processo) cadeia.push({ tipo: 'processo', id: processo.id, label: processo.numero_processo || 'Processo', sublabel: processo.status_id });
  if (processo && processo.data_resultado) {
    cadeia.push({ tipo: 'resultado', id: processo.id, label: 'Resultado', sublabel: processo.status_id });
  }

  const eventos = [];

  if (tipo === 'lote' && lote) {
    const kits = await traceRepository.kitsByLote(lote.id);
    kits.forEach((k) => eventos.push({ descricao: `Kit ${k.codigo_barras} — ${k.status}` }));
  }

  if (kit) {
    const movimentos = await traceRepository.movimentosByKit(kit.id);
    movimentos.forEach((m) => eventos.push({ data: m.data, descricao: `${m.motivo}: ${m.origem} -> ${m.destino}` }));
  }

  if (processo) {
    if (processo.data_colheita) eventos.push({ data: processo.data_colheita, descricao: 'Colheita realizada' });
    if (processo.data_resultado) eventos.push({ data: processo.data_resultado, descricao: 'Resultado disponivel' });
    if (processo.data_validacao) eventos.push({ data: processo.data_validacao, descricao: 'Resultado validado' });
  }

  eventos.sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;
    return new Date(a.data) - new Date(b.data);
  });

  return { cadeia, eventos };
};
