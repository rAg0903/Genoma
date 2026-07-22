const faturacaoRepository = require('../repositories/faturacao.repository');
const processosRepository = require('../repositories/processos.repository');
const testesRepository = require('../repositories/testes.repository');
const logService = require('./log.service');
const { loadProcessoWithAccess, assertOperacionalWriteAllowed } = require('../utils/medico-access');
const { emit, EVENTS } = require('../events');

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const ensureProcesso = (processoId, user) => loadProcessoWithAccess(processoId, user);

exports.getFaturacao = async (processoId, user) => {
  const processo = await ensureProcesso(processoId, user);
  const registos = await faturacaoRepository.findByProcesso(processoId);
  return {
    processo_id: processo.id,
    numero_processo: processo.numero_processo,
    fatura_emitida: !!processo.fatura_emitida,
    fatura_numero: processo.fatura_numero || '',
    fatura_data_emissao: processo.fatura_data_emissao || null,
    valor_base: Number(processo.valor_base || 0),
    desconto_percentual: Number(processo.desconto_percentual || 0),
    valor_final: Number(processo.valor_final || 0),
    pagamento_data: processo.pagamento_data || null,
    recibo_numero: processo.recibo_numero || '',
    pago: !!processo.pago || !!processo.pagamento_data,
    entidade_multibanco: processo.entidade_multibanco || '',
    referencia_multibanco: processo.referencia_multibanco || '',
    nao_gera_comissao: !!processo.nao_gera_comissao,
    fatura_envio_email: processo.fatura_envio_email || null,
    fatura_envio_sms: processo.fatura_envio_sms || null,
    registos,
  };
};

/**
 * Emite a fatura do processo: calcula o valor final aplicando o desconto,
 * gera numero automatico (FAT-YYYY-####), persiste o registo de faturacao e
 * avanca o processo para "Faturado".
 */
exports.emitirFatura = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
  const processo = await ensureProcesso(processoId, user);

  if (processo.fatura_emitida) {
    throw new Error('A fatura deste processo ja foi emitida.');
  }
  if (processo.status_id !== 'Validado') {
    throw new Error('So e possivel faturar processos com resultado validado.');
  }

  // Valor base: usa o fornecido, senao o preco do teste do catalogo.
  let valorBase = Number(data.valor_base);
  if (Number.isNaN(valorBase) || valorBase <= 0) {
    const teste = processo.teste_id ? await testesRepository.findById(processo.teste_id) : null;
    valorBase = Number(teste?.preco_venda || teste?.preco || 0);
  }
  if (valorBase <= 0) {
    throw new Error('Valor base da fatura invalido. Indique um valor ou defina o preco do teste.');
  }

  const desconto = Number(data.desconto_percentual || 0);
  if (desconto < 0 || desconto > 100) {
    throw new Error('Desconto percentual deve estar entre 0 e 100.');
  }

  const valorFinal = round2(valorBase * (1 - desconto / 100));

  const ano = new Date().getFullYear();
  const seq = await faturacaoRepository.getNextSequence(ano);
  const numeroFatura = `FAT-${ano}-${String(seq).padStart(4, '0')}`;
  const dataFatura = new Date().toISOString().split('T')[0];

  await faturacaoRepository.create({
    processo_id: processoId,
    preco_teste: valorBase,
    numero_fatura: numeroFatura,
    data_fatura: dataFatura,
    entidade_multibanco: data.entidade_multibanco || null,
    referencia_multibanco: data.referencia_multibanco || null,
    comissao: !!data.comissao,
  });

  await processosRepository.update(processoId, {
    status_id: 'Faturado',
    fatura_emitida: true,
    fatura_numero: numeroFatura,
    fatura_data_emissao: dataFatura,
    valor_base: valorBase,
    desconto_percentual: desconto,
    valor_final: valorFinal,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: `Emitiu fatura ${numeroFatura}`,
      tabela: 'facturacao',
    });
  }

  emit(EVENTS.FATURA_EMITIDA, {
    processo_id: processoId,
    numero_fatura: numeroFatura,
    valor_final: valorFinal,
  });

  return exports.getFaturacao(processoId, user);
};

/**
 * Regista o pagamento (data + numero de recibo), resolvendo a pendencia.
 */
exports.registarPagamento = async (processoId, data, user) => {
  await assertOperacionalWriteAllowed(user);
  const processo = await ensureProcesso(processoId, user);

  if (!processo.fatura_emitida) {
    throw new Error('Nao e possivel registar pagamento antes de emitir a fatura.');
  }
  if (!data.recibo_numero || !String(data.recibo_numero).trim()) {
    if (!processo.numero_processo) {
      throw new Error('Numero de recibo e obrigatorio ao marcar pagamento.');
    }
  }

  const reciboNumero = String(data.recibo_numero || processo.numero_processo || '').trim();
  if (!reciboNumero) {
    throw new Error('Numero de recibo e obrigatorio ao marcar pagamento.');
  }

  const pagamentoData = data.pagamento_data
    ? String(data.pagamento_data).split('T')[0]
    : new Date().toISOString().split('T')[0];

  await processosRepository.update(processoId, {
    pagamento_data: pagamentoData,
    recibo_numero: reciboNumero,
    pago: true,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Registou pagamento',
      tabela: 'processos',
    });
  }

  emit(EVENTS.PAGAMENTO_REGISTADO, {
    processo_id: processoId,
    recibo_numero: reciboNumero,
  });

  return exports.getFaturacao(processoId, user);
};
