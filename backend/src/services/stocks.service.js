const stocksRepository = require('../repositories/stocks.repository');
const tiposKitRepository = require('../repositories/tipos_kit.repository');
const empresasRepository = require('../repositories/empresas.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const { normalizeCalendarDate, isPastCalendarDate } = require('../utils/dates');
const { deriveFaseCiclo } = require('../config/kit-lifecycle');
const { MOTIVOS_MOVIMENTO } = require('../config/kit-lifecycle');
const logService = require('./log.service');
const { emit, EVENTS } = require('../events');

const STOCK_LOW_THRESHOLD = parseInt(process.env.STOCK_LOW_THRESHOLD, 10) || 5;

const deriveTrackingFromKits = (kits = []) => {
  const values = [...new Set(
    kits.map((k) => (k.tracking || '').trim()).filter(Boolean),
  )];
  return values.length ? values.join(', ') : null;
};

// Verifica o stock disponivel apos uma operacao e dispara o alerta STOCK_BAIXO
// (automacao por evento). Nunca interrompe o fluxo principal.
const checkLowStock = async () => {
  try {
    const kits = await stocksRepository.findKits();
    const disponiveis = kits.filter((k) => normalizeKitStatus(k.status) === 'Disponível').length;
    if (disponiveis <= STOCK_LOW_THRESHOLD) {
      emit(EVENTS.STOCK_BAIXO, {
        disponiveis,
        descricao: `Apenas ${disponiveis} kits disponiveis (limite ${STOCK_LOW_THRESHOLD}).`,
      });
    }
  } catch (err) {
    console.warn('Falha ao verificar stock baixo:', err.message);
  }
};

const audit = async (user, acao, tabela, registroId = null) => {
  const userId = user?.id || user?.userId || user?.sub || null;
  if (!userId) return;
  try {
    await logService.log({ utilizador_id: userId, acao, tabela, registro_id: registroId });
  } catch (err) {
    // O logging de auditoria nunca deve quebrar a operacao principal.
    console.warn('Falha ao registar auditoria:', err.message);
  }
};

const resolveActor = async (user) => {
  const id = user?.id || user?.userId || user?.sub || null;
  if (!id) return { id: null, nome: '' };
  const row = await utilizadoresRepository.findById(id);
  return { id, nome: row?.nome || '' };
};

// Converte o estado do kit para a forma sem acentos usada na base de dados.
const toDbKitStatus = (status) => {
  const map = {
    'Disponível': 'Disponivel', Disponivel: 'Disponivel',
    Reservado: 'Reservado',
    'Em trânsito': 'Em transito', 'Em transito': 'Em transito',
    Utilizado: 'Utilizado',
    'Inválido': 'Invalido', Invalido: 'Invalido',
    Perdido: 'Perdido', Expirado: 'Expirado',
  };
  return map[status] || 'Disponivel';
};

const toDateString = (value) => normalizeCalendarDate(value);

const normalizeKitStatus = (status) => {
  if (!status) return 'Disponível';
  const normalized = String(status).toLowerCase();
  if (normalized === 'disponivel' || normalized === 'disponível') return 'Disponível';
  if (normalized === 'reservado') return 'Reservado';
  if (normalized === 'em transito' || normalized === 'em trânsito') return 'Em trânsito';
  if (normalized === 'utilizado') return 'Utilizado';
  if (normalized === 'invalido' || normalized === 'inválido') return 'Inválido';
  if (normalized === 'perdido') return 'Perdido';
  if (normalized === 'expirado') return 'Expirado';
  if (normalized === 'na empresa') return 'Disponível';
  return 'Disponível';
};

const resolveLocalizacao = (row) => {
  if (row.localizacao) return row.localizacao;
  if (row.laboratorio_id) return 'Laboratorio';
  if (row.posto_id) return 'Posto';
  const status = String(row.status || '').toLowerCase();
  if (status.includes('laboratorio')) return 'Laboratorio';
  if (row.empresa_id) return 'Escritorio';
  return 'Escritorio';
};

const parseLocationRef = (data, prefix) => {
  const empresaId = data[`${prefix}_empresa_id`] ? String(data[`${prefix}_empresa_id`]).trim() : null;
  const postoId = data[`${prefix}_posto_id`] ? String(data[`${prefix}_posto_id`]).trim() : null;
  const laboratorioId = data[`${prefix}_laboratorio_id`] ? String(data[`${prefix}_laboratorio_id`]).trim() : null;
  const nome = data[`${prefix}_nome`] ? String(data[`${prefix}_nome`]).trim() : null;

  let localizacao = normalizeRequisicaoLocal(data[prefix]);
  if (empresaId) localizacao = 'Escritorio';
  if (postoId) localizacao = 'Posto';
  if (laboratorioId) localizacao = 'Laboratorio';

  return {
    localizacao,
    empresa_id: empresaId,
    posto_id: postoId,
    laboratorio_id: laboratorioId,
    nome,
  };
};

const isSameLocationRef = (a, b) => (
  a.localizacao === b.localizacao
  && (a.empresa_id || null) === (b.empresa_id || null)
  && (a.posto_id || null) === (b.posto_id || null)
  && (a.laboratorio_id || null) === (b.laboratorio_id || null)
);

const toDestinoRef = (ref) => ({
  empresa_id: ref.localizacao === 'Escritorio' ? ref.empresa_id : null,
  posto_id: ref.localizacao === 'Posto' ? ref.posto_id : null,
  laboratorio_id: ref.localizacao === 'Laboratorio' ? ref.laboratorio_id : null,
});

const formatRequisicaoEndpoint = (localizacao, nome) => {
  if (nome) {
    const prefix = localizacao === 'Escritorio' ? 'Empresa' : localizacao === 'Posto' ? 'Posto' : 'Laboratório';
    return `${prefix}: ${nome}`;
  }
  if (localizacao === 'Escritorio') return 'Empresa';
  if (localizacao === 'Posto') return 'Posto';
  if (localizacao === 'Laboratorio') return 'Laboratório';
  return localizacao || '—';
};

const formatRequisicaoRoute = (origemRef, origem, destinoRef, destino) =>
  `${formatRequisicaoEndpoint(origem, origemRef.nome)} → ${formatRequisicaoEndpoint(destino, destinoRef.nome)}`;

const resolveTipoKit = (row) => row.tipo_kit_nome || row.tipo_kit_id || '';

const resolveLoteCodigo = (row) => row.codigo_lote || row.lote_id || '';

const normalizeDateInput = (value) => {
  const normalized = normalizeCalendarDate(value);
  return normalized || null;
};

const isValidDate = (value) => !!normalizeDateInput(value);

exports.listKits = async () => {
  const rows = await stocksRepository.findKits();
  return rows.map(mapKitRow);
};

exports.listLotes = async () => {
  const rows = await stocksRepository.findLotes();
  return rows.map((row) => {
    const totalFromDb = Number(row.quantidade || 0);
    const total = totalFromDb > 0 ? totalFromDb : Number(row.kits_total || 0);
    const disponivel = Number(row.kits_disponiveis || 0);
    const validade = toDateString(row.validade) || toDateString(row.data_validade_max);

    return {
      id: row.id,
      codigo: row.codigo_lote || '',
      tipo_kit: resolveTipoKit(row),
      tipo_teste: row.tipo_teste || '',
      teste_id: row.teste_id || '',
      teste_nome: row.teste_nome || '',
      quantidade_total: total,
      quantidade_disponivel: disponivel,
      data_rececao: toDateString(row.data_rececao),
      data_validade: validade,
      fornecedor: row.fornecedor_nome || '',
      fornecedor_id: row.fornecedor_id || '',
    };
  });
};

exports.createLote = async (data, user) => {
  if (!data.codigo || !data.codigo.trim()) {
    throw new Error('Código do lote é obrigatório');
  }
  if (!data.tipo_kit || !data.tipo_kit.trim()) {
    throw new Error('Tipo de kit é obrigatório');
  }
  if (!data.fornecedor || !data.fornecedor.trim()) {
    throw new Error('Fornecedor é obrigatório');
  }

  if (!isValidDate(data.data_rececao)) {
    throw new Error('Data de receção inválida');
  }
  if (!isValidDate(data.data_validade)) {
    throw new Error('Data de validade inválida');
  }

  const codigo = data.codigo.trim();
  const existente = await stocksRepository.findLoteByCodigo(codigo);
  if (existente) {
    throw new Error('Já existe um lote com este código');
  }

  let tipoKitId = data.tipo_kit_id || null;
  let tipoKitNome = data.tipo_kit?.trim() || '';
  if (tipoKitId) {
    const tipoKit = await tiposKitRepository.findById(tipoKitId);
    if (!tipoKit) throw new Error('Tipo de kit não encontrado');
    tipoKitNome = tipoKit.nome;
  } else if (tipoKitNome) {
    const existente = await tiposKitRepository.findByNome(tipoKitNome);
    if (existente) {
      tipoKitId = existente.id;
    } else {
      const novo = await tiposKitRepository.create({ nome: tipoKitNome });
      tipoKitId = novo.id;
    }
  } else {
    throw new Error('Tipo de kit é obrigatório');
  }

  const fornecedorNome = data.fornecedor.trim();
  let fornecedorId = data.fornecedor_id || null;
  if (!fornecedorId) {
    const fornecedor = await empresasRepository.findByNome(fornecedorNome);
    if (fornecedor) {
      fornecedorId = fornecedor.id;
    } else {
      const novoFornecedor = await empresasRepository.create({
        nome: fornecedorNome,
        morada: null,
        codigo_postal: null,
        telefone: null,
        email: null,
      });
      fornecedorId = novoFornecedor.id;
    }
  }

  const dataRececao = normalizeDateInput(data.data_rececao);
  const dataValidade = normalizeDateInput(data.data_validade);

  // O lote é criado vazio. Os kits são inseridos manualmente depois,
  // respeitando a numeração fornecida pelo laboratório (createKit).
  const testeId = data.teste_id ? String(data.teste_id).trim() : null;
  let tipoTeste = data.tipo_teste ? String(data.tipo_teste).trim() : null;
  let testeNome = '';

  if (testeId) {
    const testesRepository = require('../repositories/testes.repository');
    const teste = await testesRepository.findById(testeId);
    if (!teste) throw new Error('Teste não encontrado');
    testeNome = teste.nome || '';
    if (!tipoTeste && teste.tipo_teste) tipoTeste = String(teste.tipo_teste).trim();
  }

  const created = await stocksRepository.createLote({
    codigo_lote: codigo,
    tipo_kit_id: tipoKitId,
    tipo_teste: tipoTeste,
    teste_id: testeId,
    fornecedor_id: fornecedorId,
    data_rececao: dataRececao,
    validade: dataValidade,
    quantidade: 0,
    estado: data.estado || 'Disponivel',
  });

  await audit(user, `Criou lote ${codigo} (vazio)`, 'lotes');

  return {
    id: created.id,
    codigo,
    tipo_kit: tipoKitNome,
    tipo_teste: tipoTeste || '',
    teste_id: testeId || '',
    teste_nome: testeNome,
    quantidade_total: 0,
    quantidade_disponivel: 0,
    data_rececao: dataRececao || '',
    data_validade: dataValidade || '',
    fornecedor: fornecedorNome,
    fornecedor_id: fornecedorId || '',
  };
};

const resolveTipoKitId = async (tipoKitNome) => {
  if (!tipoKitNome || !tipoKitNome.trim()) return null;
  const nome = tipoKitNome.trim();
  const existente = await tiposKitRepository.findByNome(nome);
  if (existente) return existente.id;
  const novo = await tiposKitRepository.create({ nome });
  return novo.id;
};

// Verificação imediata de duplicado para a UI de leitura de código de barras.
exports.checkKitDuplicado = async (codigoBarras) => {
  const codigo = String(codigoBarras || '').trim();
  if (!codigo) return { duplicado: false };
  const existente = await stocksRepository.findKitByCodigo(codigo);
  if (!existente) return { duplicado: false };
  return {
    duplicado: true,
    codigo_barras: existente.codigo_barras,
    numero_processo: existente.numero_processo || null,
    paciente_nome: existente.paciente_nome || null,
  };
};

exports.createKit = async (data, user) => {
  if (!data.codigo_barras || !String(data.codigo_barras).trim()) {
    throw new Error('Código de barras do kit é obrigatório');
  }
  const existente = await stocksRepository.findKitByCodigo(String(data.codigo_barras).trim());
  if (existente) {
    let detalhe = '';
    if (existente.numero_processo) {
      detalhe = ` (associado ao processo ${existente.numero_processo}`;
      detalhe += existente.paciente_nome ? ` — ${existente.paciente_nome})` : ')';
    } else if (existente.paciente_nome) {
      detalhe = ` (cliente: ${existente.paciente_nome})`;
    }
    const err = new Error(`Kit repetido: já existe um kit com o número "${String(data.codigo_barras).trim()}"${detalhe}`);
    err.code = 'KIT_DUPLICADO';
    throw err;
  }
  const tipoKitId = data.tipo_kit ? await resolveTipoKitId(data.tipo_kit) : (data.tipo_kit_id || null);
  const lote = data.lote ? await stocksRepository.findLoteByCodigo(data.lote) : null;

  let empresaId = data.empresa_id ? String(data.empresa_id).trim() : null;
  if (!empresaId && lote?.fornecedor_id) {
    empresaId = lote.fornecedor_id;
  }
  if (!empresaId && user?.empresa_id) {
    empresaId = user.empresa_id;
  }

  const created = await stocksRepository.createKit({
    codigo_barras: String(data.codigo_barras).trim(),
    tracking: data.tracking ? String(data.tracking).trim() : null,
    tipo_kit_id: tipoKitId,
    lote_id: lote ? lote.id : null,
    empresa_id: empresaId,
    posto_id: null,
    status: toDbKitStatus(data.status),
    localizacao: data.localizacao || 'Escritorio',
    data_validade: normalizeDateInput(data.data_validade),
  });

  await audit(user, `Criou kit ${data.codigo_barras}`, 'kits');
  const row = await stocksRepository.findKitById(created.id);
  return mapKitRow(row);
};

exports.updateKit = async (id, data, user) => {
  const kit = await stocksRepository.findKitById(id);
  if (!kit) throw new Error('Kit não encontrado');

  const fields = {};
  if (data.codigo_barras !== undefined) fields.codigo_barras = String(data.codigo_barras).trim();
  if (data.tracking !== undefined) fields.tracking = data.tracking ? String(data.tracking).trim() : null;
  if (data.status !== undefined) fields.status = toDbKitStatus(data.status);
  if (data.localizacao !== undefined) fields.localizacao = data.localizacao;
  if (data.data_validade !== undefined) fields.data_validade = normalizeDateInput(data.data_validade);
  if (data.tipo_kit !== undefined) fields.tipo_kit_id = await resolveTipoKitId(data.tipo_kit);
  if (data.lote !== undefined) {
    const lote = data.lote ? await stocksRepository.findLoteByCodigo(data.lote) : null;
    fields.lote_id = lote ? lote.id : null;
  }

  await stocksRepository.updateKit(id, fields);
  await audit(user, `Atualizou kit ${kit.codigo_barras}`, 'kits');
  const row = await stocksRepository.findKitById(id);
  return mapKitRow(row);
};

exports.deleteKit = async (id, user) => {
  const kit = await stocksRepository.findKitById(id);
  if (!kit) throw new Error('Kit não encontrado');
  await stocksRepository.deleteKit(id);
  await audit(user, `Eliminou kit ${kit.codigo_barras}`, 'kits');
};

exports.updateLote = async (id, data, user) => {
  const lote = await stocksRepository.findLoteById(id);
  if (!lote) throw new Error('Lote não encontrado');

  const fields = {};
  if (data.codigo !== undefined) fields.codigo_lote = String(data.codigo).trim();
  if (data.data_rececao !== undefined) fields.data_rececao = normalizeDateInput(data.data_rececao);
  if (data.data_validade !== undefined) fields.validade = normalizeDateInput(data.data_validade);
  if (data.quantidade_total !== undefined) fields.quantidade = Number(data.quantidade_total) || 0;
  if (data.estado !== undefined) fields.estado = data.estado;
  if (data.tipo_kit_id !== undefined) fields.tipo_kit_id = data.tipo_kit_id || null;
  else if (data.tipo_kit !== undefined) fields.tipo_kit_id = await resolveTipoKitId(data.tipo_kit);
  if (data.tipo_teste !== undefined) fields.tipo_teste = data.tipo_teste ? String(data.tipo_teste).trim() : null;
  if (data.teste_id !== undefined) {
    const testeId = data.teste_id ? String(data.teste_id).trim() : null;
    fields.teste_id = testeId;
    if (testeId) {
      const testesRepository = require('../repositories/testes.repository');
      const teste = await testesRepository.findById(testeId);
      if (!teste) throw new Error('Teste não encontrado');
      fields.tipo_teste = teste.tipo_teste ? String(teste.tipo_teste).trim() : null;
    } else if (data.tipo_teste === undefined) {
      fields.tipo_teste = null;
    }
  }
  if (data.fornecedor !== undefined && data.fornecedor) {
    const f = await empresasRepository.findByNome(String(data.fornecedor).trim());
    fields.fornecedor_id = f ? f.id : null;
  }

  await stocksRepository.updateLote(id, fields);
  await audit(user, `Atualizou lote ${lote.codigo_lote}`, 'lotes');
};

exports.deleteMovimento = async (id, user) => {
  const removed = await stocksRepository.deleteMovimento(id);
  if (!removed) throw new Error('Movimento não encontrado');
  await audit(user, 'Eliminou movimento de kit', 'movimentos_kits');
};

const mapKitRow = (row) => ({
  id: row.id,
  codigo_barras: row.codigo_barras || '',
  tracking: row.tracking || '',
  tipo_kit: resolveTipoKit(row),
  lote: resolveLoteCodigo(row),
  status: normalizeKitStatus(row.status),
  data_validade: toDateString(row.data_validade),
  localizacao: resolveLocalizacao(row),
  fase_ciclo: deriveFaseCiclo(row),
  empresa_id: row.empresa_id || '',
  posto_id: row.posto_id || '',
  laboratorio_id: row.laboratorio_id || '',
});

// Os estados "Pendente"/"Em transito" foram eliminados nos envios de kits.
// Um envio fica imediatamente "Entregue" (o kit é movido automaticamente
// para o destino), podendo apenas ser "Cancelada".
const normalizeRequisicaoStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'cancelada') return 'Cancelada';
  return 'Entregue';
};

const normalizeRequisicaoLocal = (value) => {
  if (value === 'Posto' || value === 'Laboratorio' || value === 'Escritorio') return value;
  return 'Escritorio';
};

exports.listRequisicoes = async () => {
  const rows = await stocksRepository.findRequisicoes();
  return rows.map((row) => ({
    id: row.id,
    numero_envio: row.numero_envio || '',
    data: toDateString(row.data),
    origem: normalizeRequisicaoLocal(row.origem),
    destino: normalizeRequisicaoLocal(row.destino),
    origem_nome: row.origem_nome || '',
    destino_nome: row.destino_nome || '',
    origem_empresa_id: row.origem_empresa_id || '',
    origem_posto_id: row.origem_posto_id || '',
    origem_laboratorio_id: row.origem_laboratorio_id || '',
    destino_empresa_id: row.destino_empresa_id || '',
    destino_posto_id: row.destino_posto_id || '',
    destino_laboratorio_id: row.destino_laboratorio_id || '',
    quantidade: Number(row.quantidade || row.itens_count || 0),
    status: normalizeRequisicaoStatus(row.status),
    tracking_number: row.tracking_number || row.kits_tracking || '',
    transportadora: row.transportadora || '',
    lote_codigo: row.codigo_lote || '',
    kit_ids: row.kit_ids_concat ? String(row.kit_ids_concat).split(',').filter(Boolean) : [],
    utilizador_id: row.utilizador_id || '',
    utilizador_nome: row.utilizador_nome || '',
    observacoes: row.observacoes || '',
  }));
};

exports.listMovimentos = async () => {
  const rows = await stocksRepository.findMovimentos();
  return rows.map((row) => ({
    id: row.id,
    data: toDateString(row.data),
    kit_codigo: row.codigo_barras || '',
    origem: normalizeRequisicaoLocal(row.origem),
    destino: normalizeRequisicaoLocal(row.destino),
    motivo: row.motivo || 'Envio',
    observacoes: row.observacoes || '',
  }));
};

exports.createRequisicao = async (data, user) => {
  const actor = await resolveActor(user);
  const origemRef = parseLocationRef(data, 'origem');
  const destinoRef = parseLocationRef(data, 'destino');
  const origem = origemRef.localizacao;
  const destino = destinoRef.localizacao;

  if (!origemRef.empresa_id && !origemRef.posto_id && !origemRef.laboratorio_id) {
    throw new Error('Selecione a origem (empresa ou posto)');
  }
  if (!destinoRef.empresa_id && !destinoRef.posto_id && !destinoRef.laboratorio_id) {
    throw new Error('Selecione o destino (empresa ou posto)');
  }
  if (isSameLocationRef(origemRef, destinoRef)) {
    throw new Error('Origem e destino devem ser diferentes');
  }
  if (destino === 'Laboratorio' || origem === 'Laboratorio') {
    throw new Error('Envios entre empresa e postos não incluem laboratório final. Use Descarte/Envio lab.');
  }

  if (!isValidDate(data.data)) {
    throw new Error('Data inválida');
  }
  if (isPastCalendarDate(data.data)) {
    throw new Error('A data do envio não pode ser anterior a hoje');
  }

  let loteId = null;
  if (data.lote_codigo) {
    const lote = await stocksRepository.findLoteByCodigo(data.lote_codigo);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }
    loteId = lote.id;
  }

  const kitIds = Array.isArray(data.kit_ids)
    ? data.kit_ids.map((id) => String(id).trim()).filter(Boolean)
    : [];

  let kitsDisponiveis;
  let quantidade;

  if (kitIds.length > 0) {
    kitsDisponiveis = await stocksRepository.findKitsByIdsForShipment({
      kitIds,
      origem,
      loteId,
      origemEmpresaId: origemRef.empresa_id,
      origemPostoId: origemRef.posto_id,
      origemLaboratorioId: origemRef.laboratorio_id,
    });
    if (kitsDisponiveis.length !== kitIds.length) {
      throw new Error('Um ou mais kits não estão disponíveis na origem selecionada');
    }
    quantidade = kitsDisponiveis.length;
  } else {
    quantidade = Number(data.quantidade);
    if (Number.isNaN(quantidade) || quantidade <= 0) {
      throw new Error('Quantidade inválida');
    }
    kitsDisponiveis = await stocksRepository.findAvailableKits({
      origem,
      loteId,
      quantidade,
    });
    if (kitsDisponiveis.length < quantidade) {
      throw new Error('Não existem kits suficientes disponíveis');
    }
  }

  const kitStatusDb = 'Disponivel';

  const requisicao = {
    numero_envio: await stocksRepository.generateNumeroEnvio(),
    utilizador_id: actor.id,
    data: normalizeDateInput(data.data),
    origem,
    destino,
    origem_empresa_id: origemRef.empresa_id,
    origem_posto_id: origemRef.posto_id,
    origem_laboratorio_id: origemRef.laboratorio_id,
    destino_empresa_id: destinoRef.empresa_id,
    destino_posto_id: destinoRef.posto_id,
    destino_laboratorio_id: destinoRef.laboratorio_id,
    origem_nome: origemRef.nome,
    destino_nome: destinoRef.nome,
    quantidade,
    // Envio fica imediatamente concluído (sem estados pendente/em trânsito).
    status: 'Entregue',
    tracking_number: deriveTrackingFromKits(kitsDisponiveis),
    transportadora: null,
    lote_id: loteId,
    observacoes: data.observacoes || null,
    kit_status: kitStatusDb,
  };

  const movimentos = kitsDisponiveis.map((kit) => ({
    data: requisicao.data,
    kit_id: kit.id,
    origem,
    destino,
    motivo: MOTIVOS_MOVIMENTO.ENVIO,
    observacoes: data.observacoes || null,
  }));

  const created = await stocksRepository.createRequisicaoWithKits({
    requisicao,
    kits: kitsDisponiveis,
    movimentos,
    destinoRef: toDestinoRef(destinoRef),
  });

  await audit(
    user,
    `Criou requisicao ${formatRequisicaoRoute(origemRef, origem, destinoRef, destino)} (${quantidade} kits)`,
    'requisicoes_kits',
    created.id,
  );
  await checkLowStock();

  return {
    id: created.id,
    numero_envio: requisicao.numero_envio,
    data: toDateString(requisicao.data),
    origem,
    destino,
    origem_nome: origemRef.nome || '',
    destino_nome: destinoRef.nome || '',
    quantidade,
    status: normalizeRequisicaoStatus(requisicao.status),
    tracking_number: requisicao.tracking_number || '',
    transportadora: requisicao.transportadora || '',
    lote_codigo: data.lote_codigo || '',
    utilizador_id: actor.id || '',
    utilizador_nome: actor.nome || '',
    observacoes: requisicao.observacoes || '',
  };
};

/**
 * Regista descarte/envio para laboratório final (requisicoes_kits + movimentos Descarte).
 * Pode correr dentro de uma transacção existente (connection) ou criar a sua própria.
 */
exports.registerDescarteForKits = async ({
  connection = null,
  kitIds,
  origem,
  origemRef,
  data,
  labId,
  labNome,
  utilizadorId = null,
  observacoes = null,
  skipPastDateCheck = false,
  user = null,
}) => {
  if (!kitIds?.length) {
    throw new Error('Selecione pelo menos um kit utilizado ou expirado');
  }
  if (!isValidDate(data)) {
    throw new Error('Data inválida');
  }
  if (!skipPastDateCheck && isPastCalendarDate(data)) {
    throw new Error('A data do envio não pode ser anterior a hoje');
  }
  if (!labId || !labNome) {
    throw new Error('Laboratório final não encontrado ou inválido');
  }
  if (origem !== 'Escritorio' && origem !== 'Posto') {
    throw new Error('A origem do descarte deve ser uma empresa ou um posto');
  }

  const run = async (conn) => {
    const placeholders = kitIds.map(() => '?').join(',');
    const params = [...kitIds, origem];
    let sql = `
      SELECT k.id, k.codigo_barras, k.tracking, k.status, k.data_validade
      FROM kits k
      WHERE k.id IN (${placeholders})
        AND k.localizacao = ?
        AND (k.fase_ciclo IS NULL OR k.fase_ciclo NOT IN ('em_lab_final', 'em_transito_lab'))
        AND (
          k.fase_ciclo = 'aguarda_envio_lab'
          OR k.status IN ('Utilizado', 'Expirado')
          OR (k.status = 'Disponivel' AND k.data_validade IS NOT NULL AND k.data_validade < CURDATE())
        )
    `;
    if (origem === 'Escritorio' && origemRef?.empresa_id) {
      sql += ' AND (k.empresa_id = ? OR k.empresa_id IS NULL)';
      params.push(origemRef.empresa_id);
    }
    if (origem === 'Posto' && origemRef?.posto_id) {
      sql += ' AND k.posto_id = ?';
      params.push(origemRef.posto_id);
    }

    const [kitsElegiveis] = await conn.execute(sql, params);
    if (kitsElegiveis.length !== kitIds.length) {
      throw new Error('Um ou mais kits não estão elegíveis para descarte (utilizados/expirados na origem)');
    }

    const dataDescarte = normalizeDateInput(data);
    const destinoRef = {
      localizacao: 'Laboratorio',
      empresa_id: null,
      posto_id: null,
      laboratorio_id: labId,
      nome: labNome,
    };

    const requisicao = {
      numero_envio: await stocksRepository.generateNumeroEnvio(conn),
      utilizador_id: utilizadorId,
      data: dataDescarte,
      origem,
      destino: 'Laboratorio',
      origem_empresa_id: origemRef?.empresa_id || null,
      origem_posto_id: origemRef?.posto_id || null,
      origem_laboratorio_id: null,
      destino_empresa_id: null,
      destino_posto_id: null,
      destino_laboratorio_id: labId,
      origem_nome: origemRef?.nome || '',
      destino_nome: labNome,
      quantidade: kitsElegiveis.length,
      status: 'Entregue',
      tracking_number: deriveTrackingFromKits(kitsElegiveis),
      transportadora: null,
      lote_id: null,
      observacoes: observacoes || null,
      kit_status: 'Utilizado',
    };

    const movimentos = kitsElegiveis.map((kit) => ({
      data: requisicao.data,
      kit_id: kit.id,
      origem,
      destino: 'Laboratorio',
      motivo: MOTIVOS_MOVIMENTO.DESCARTE,
      observacoes: observacoes || null,
    }));

    const created = await stocksRepository.createRequisicaoWithKits({
      requisicao,
      kits: kitsElegiveis,
      movimentos,
      destinoRef: toDestinoRef(destinoRef),
      connection: conn,
    });

    for (const kit of kitsElegiveis) {
      await conn.execute(
        `UPDATE processos SET status_id = 'Enviado Laboratorio',
          laboratorio_final_id = COALESCE(laboratorio_final_id, ?),
          data_chegada_laboratorio = COALESCE(data_chegada_laboratorio, ?),
          data_envio_laboratorio = COALESCE(data_envio_laboratorio, ?),
          data_colheita = COALESCE(
            data_colheita,
            (SELECT MIN(mk.data) FROM movimentos_kits mk
             WHERE mk.kit_id = processos.kit_id AND mk.motivo = 'ConsumoColheita')
          ),
          data_entrada = COALESCE(
            data_entrada,
            (SELECT MIN(mk.data) FROM movimentos_kits mk
             WHERE mk.kit_id = processos.kit_id AND mk.motivo = 'ConsumoColheita')
          )
         WHERE kit_id = ? AND status_id IN ('Colheita Realizada', 'Enviado Laboratorio')`,
        [labId, dataDescarte, dataDescarte, kit.id],
      );
    }

    return {
      id: created.id,
      numero_envio: requisicao.numero_envio,
      data: toDateString(requisicao.data),
      origem,
      destino: 'Laboratorio',
      origem_nome: origemRef?.nome || '',
      destino_nome: labNome,
      destino_laboratorio_id: labId,
      quantidade: requisicao.quantidade,
      status: normalizeRequisicaoStatus(requisicao.status),
      tracking_number: requisicao.tracking_number || '',
      transportadora: '',
      lote_codigo: '',
      utilizador_id: utilizadorId || '',
      utilizador_nome: '',
      observacoes: requisicao.observacoes || '',
    };
  };

  if (connection) {
    return run(connection);
  }

  const pool = require('../config/database');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const created = await run(conn);
    await conn.commit();
    if (user) {
      await audit(
        user,
        `Registou descarte/envio lab ${origemRef?.nome || origem} → ${labNome} (${created.quantidade} kits)`,
        'requisicoes_kits',
        created.id,
      );
    }
    return created;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

exports.createDescarte = async (data, user) => {
  const laboratorioFinalService = require('./laboratorio-final.service');
  const actor = await resolveActor(user);
  const origemRef = parseLocationRef(data, 'origem');
  const origem = origemRef.localizacao;

  if (origem !== 'Escritorio' && origem !== 'Posto') {
    throw new Error('A origem do descarte deve ser uma empresa ou um posto');
  }
  if (!origemRef.empresa_id && !origemRef.posto_id) {
    throw new Error('Selecione a origem (empresa ou posto)');
  }

  if (!isValidDate(data.data)) {
    throw new Error('Data inválida');
  }
  if (isPastCalendarDate(data.data)) {
    throw new Error('A data do envio não pode ser anterior a hoje');
  }

  const kitIds = Array.isArray(data.kit_ids)
    ? data.kit_ids.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (kitIds.length === 0) {
    throw new Error('Selecione pelo menos um kit utilizado ou expirado');
  }

  const kitsElegiveis = await stocksRepository.findKitsByIdsForDescarte({
    kitIds,
    origem,
    origemEmpresaId: origemRef.empresa_id,
    origemPostoId: origemRef.posto_id,
  });

  if (kitsElegiveis.length !== kitIds.length) {
    throw new Error('Um ou mais kits não estão elegíveis para descarte (utilizados/expirados na origem)');
  }

  const labIdsResolved = [];
  for (const kit of kitsElegiveis) {
    const resolvedLabId = await laboratorioFinalService.resolveLaboratorioFinalForKit({ kitId: kit.id });
    if (!resolvedLabId) {
      throw new Error(
        `Kit ${kit.codigo_barras || kit.id}: configure o laboratório final no teste associado (Administração > Testes)`,
      );
    }
    labIdsResolved.push(resolvedLabId);
  }

  const uniqueLabIds = [...new Set(labIdsResolved)];
  if (uniqueLabIds.length > 1) {
    throw new Error('Os kits selecionados têm laboratórios finais diferentes. Registe descartes separados por destino.');
  }

  const labId = uniqueLabIds[0];
  const pool = require('../config/database');
  const connection = await pool.getConnection();
  let labNome = '';
  try {
    const [rows] = await connection.execute(
      'SELECT nome FROM laboratorios WHERE id = ? AND tipo = \'final\' LIMIT 1',
      [labId],
    );
    labNome = rows[0]?.nome || '';
  } finally {
    connection.release();
  }
  if (!labNome) {
    throw new Error('Laboratório final não encontrado ou inválido');
  }

  const created = await exports.registerDescarteForKits({
    kitIds,
    origem,
    origemRef,
    data: data.data,
    labId,
    labNome,
    utilizadorId: actor.id,
    observacoes: data.observacoes || null,
    user,
  });

  return {
    ...created,
    utilizador_nome: actor.nome || '',
  };
};

exports.updateRequisicao = async (id, data, user) => {
  const existing = await stocksRepository.findRequisicaoById(id);
  if (!existing) throw new Error('Envio não encontrado');

  const currentStatus = normalizeRequisicaoStatus(existing.status);
  if (currentStatus === 'Cancelada') {
    throw new Error('Não é possível editar um envio cancelado');
  }

  const origemRef = parseLocationRef(data, 'origem');
  const destinoRef = parseLocationRef(data, 'destino');
  const origem = origemRef.localizacao;
  const destino = destinoRef.localizacao;

  if (!origemRef.empresa_id && !origemRef.posto_id && !origemRef.laboratorio_id) {
    throw new Error('Selecione a origem (empresa, posto ou laboratório)');
  }
  if (!destinoRef.empresa_id && !destinoRef.posto_id && !destinoRef.laboratorio_id) {
    throw new Error('Selecione o destino (empresa, posto ou laboratório)');
  }
  if (isSameLocationRef(origemRef, destinoRef)) {
    throw new Error('Origem e destino devem ser diferentes');
  }
  if (destino === 'Laboratorio' || origem === 'Laboratorio' || existing.destino === 'Laboratorio') {
    throw new Error('Não é possível editar envios para laboratório final neste ecrã');
  }

  if (!isValidDate(data.data)) {
    throw new Error('Data inválida');
  }
  const newDate = normalizeDateInput(data.data);
  const existingDate = toDateString(existing.data);
  if (isPastCalendarDate(data.data) && newDate !== existingDate) {
    throw new Error('A data do envio não pode ser anterior a hoje');
  }

  const quantidade = Number(data.quantidade);
  if (Number.isNaN(quantidade) || quantidade <= 0) {
    throw new Error('Quantidade inválida');
  }

  const kitIds = await stocksRepository.findKitIdsByRequisicaoId(id);
  if (!kitIds.length) {
    throw new Error('Envio sem kits associados');
  }

  const requisicao = {
    data: normalizeDateInput(data.data),
    origem,
    destino,
    origem_empresa_id: origemRef.empresa_id,
    origem_posto_id: origemRef.posto_id,
    origem_laboratorio_id: origemRef.laboratorio_id,
    destino_empresa_id: destinoRef.empresa_id,
    destino_posto_id: destinoRef.posto_id,
    destino_laboratorio_id: destinoRef.laboratorio_id,
    origem_nome: origemRef.nome,
    destino_nome: destinoRef.nome,
    quantidade,
    status: normalizeRequisicaoStatus(data.status || existing.status),
    tracking_number: data.tracking_number || existing.tracking_number || null,
    transportadora: data.transportadora || existing.transportadora || null,
    observacoes: data.observacoes ?? existing.observacoes ?? null,
    kit_status: 'Disponivel',
  };

  await stocksRepository.updateRequisicaoWithKits(id, {
    requisicao,
    destinoRef: toDestinoRef(destinoRef),
    kitIds,
  });

  await audit(
    user,
    `Atualizou envio ${formatRequisicaoRoute(origemRef, origem, destinoRef, destino)} (${quantidade} kits)`,
    'requisicoes_kits',
    id,
  );
  await checkLowStock();

  return {
    id,
    numero_envio: existing.numero_envio || '',
    data: toDateString(requisicao.data),
    origem,
    destino,
    origem_nome: origemRef.nome || '',
    destino_nome: destinoRef.nome || '',
    origem_empresa_id: origemRef.empresa_id || '',
    origem_posto_id: origemRef.posto_id || '',
    origem_laboratorio_id: origemRef.laboratorio_id || '',
    destino_empresa_id: destinoRef.empresa_id || '',
    destino_posto_id: destinoRef.posto_id || '',
    destino_laboratorio_id: destinoRef.laboratorio_id || '',
    quantidade,
    status: requisicao.status,
    tracking_number: requisicao.tracking_number || '',
    transportadora: requisicao.transportadora || '',
    lote_codigo: existing.codigo_lote || '',
    kit_ids: kitIds,
    utilizador_id: existing.utilizador_id || '',
    utilizador_nome: existing.utilizador_nome || '',
    observacoes: requisicao.observacoes || '',
  };
};

exports.deleteRequisicao = async (id, user) => {
  await stocksRepository.deleteRequisicao(id);
  await audit(user, 'Eliminou requisicao', 'requisicoes_kits');
};

exports.createMovimento = async (data, user) => {
  const origem = normalizeRequisicaoLocal(data.origem);
  const destino = normalizeRequisicaoLocal(data.destino);
  if (origem === 'Laboratorio') {
    throw new Error('Não é permitido mover kits a partir do laboratório');
  }
  if (origem === destino) {
    throw new Error('Origem e destino devem ser diferentes');
  }

  if (!isValidDate(data.data)) {
    throw new Error('Data inválida');
  }

  const kitCodigo = String(data.kit_codigo || '').trim().toLowerCase();
  if (!kitCodigo) {
    throw new Error('Código do kit é obrigatório');
  }

  const kits = await stocksRepository.findKits();
  const kit = kits.find((k) => String(k.codigo_barras || '').toLowerCase() === kitCodigo);
  if (!kit) {
    throw new Error('Kit não encontrado');
  }

  const motivo = data.motivo || 'Transferencia';
  const kitStatus = motivo === 'Consumo'
    ? 'Utilizado'
    : (motivo === 'SMS Colheita'
      ? 'Em transito'
      : (kit.status === 'Invalido' || kit.status === 'Perdido'
        ? kit.status
        : 'Disponivel'));

  const movId = await stocksRepository.createMovimento({
    data: normalizeDateInput(data.data),
    kit_id: kit.id,
    origem,
    destino,
    motivo,
    observacoes: data.observacoes || null,
    requisicao_id: data.requisicao_id || null,
    kit_status: kitStatus,
    destino_posto_id: data.destino_posto_id || null,
  });

  await audit(user, `Registou movimento ${motivo} (${kit.codigo_barras})`, 'movimentos_kits');
  if (kitStatus !== 'Disponivel') await checkLowStock();

  return {
    id: movId,
    data: toDateString(data.data),
    kit_codigo: kit.codigo_barras,
    origem,
    destino,
    motivo,
    observacoes: data.observacoes || '',
  };
};

exports.confirmLabArrival = async (kitId, data, user) => {
  const pool = require('../config/database');
  const kitLifecycleService = require('./kit-lifecycle.service');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await kitLifecycleService.confirmLabArrival(connection, {
      kitId,
      processoId: data.processo_id || null,
      dataChegada: normalizeDateInput(data.data_chegada) || undefined,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await audit(user, `Confirmou recepção do kit no laboratório`, 'kits', kitId);
  const row = await stocksRepository.findKitById(kitId);
  return mapKitRow(row);
};

exports.revertDescarteForKit = async (kitId, data, user) => {
  if (!kitId) throw new Error('Kit é obrigatório');

  const pool = require('../config/database');
  const kitLifecycleService = require('./kit-lifecycle.service');
  const connection = await pool.getConnection();
  let result;

  try {
    await connection.beginTransaction();
    result = await kitLifecycleService.revertDescarteToOrigin(connection, {
      kitId,
      observacoes: data?.observacoes || null,
      reverterProcesso: data?.reverter_processo !== false,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await audit(
    user,
    `Devolveu kit do descarte para ${result.origem_nome || result.origem}`,
    'kits',
    kitId,
  );

  const row = await stocksRepository.findKitById(kitId);
  return {
    ...mapKitRow(row),
    processo_revertido: result.processo_revertido,
    origem_nome: result.origem_nome,
  };
};

exports.getKitTrace = async (kitId) => {
  const rows = await stocksRepository.findMovimentosByKitId(kitId);
  return rows.map((row) => ({
    id: row.id,
    data: toDateString(row.data),
    origem: normalizeRequisicaoLocal(row.origem),
    destino: normalizeRequisicaoLocal(row.destino),
    motivo: row.motivo || '',
    observacoes: row.observacoes || '',
    processo_id: row.processo_id || '',
  }));
};
