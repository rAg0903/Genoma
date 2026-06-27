const processosService = require('./processos.service');
const pacientesService = require('./pacientes.service');
const { isMedicoUser } = require('../utils/medico-access');
const colheitasService = require('./colheitas.service');
const colheitasRepository = require('../repositories/colheitas.repository');
const stocksRepository = require('../repositories/stocks.repository');
const logRepository = require('../repositories/log.repository');
const listagensRepository = require('../repositories/listagens.repository');
const { formatCalendarDate } = require('../utils/calendar-dates');

/**
 * Servico do modulo Listagens — centro de reporting operacional.
 *
 * Cada listagem reutiliza, sempre que possivel, os servicos/repositorios de
 * dominio ja existentes (consultas provadas), aplicando depois pesquisa,
 * filtros, ordenacao e paginacao de forma generica. Isto mantem o risco baixo
 * e permite evoluir para filtragem em SQL no futuro sem alterar a API.
 */

const toStr = (v) => (v === null || v === undefined ? '' : String(v));
const norm = (v) => toStr(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const toDate = (v) => {
  const formatted = formatCalendarDate(v);
  return formatted == null || formatted === '' ? '' : String(formatted);
};
const bool = (v) => v === true || v === 1 || v === '1';

const addCalendarDays = (iso, days) => {
  const base = toDate(iso);
  if (!base || days == null || Number.isNaN(Number(days))) return '';
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + Number(days));
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const LAB_ENVIADO_STATUSES = new Set([
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
]);

// ---------------------------------------------------------------------------
// Mappers — normalizam cada dominio numa linha estavel para tabela/export.
// ---------------------------------------------------------------------------

const mapProcesso = (p) => ({
  id: p.id,
  numero: p.numero_processo || '',
  paciente: p.paciente_nome || '',
  paciente_id: p.paciente_id || null,
  medico: p.medico_nome || '',
  medico_id: p.medico_id || null,
  teste: p.teste_nome || '',
  empresa: p.empresa_nome || '',
  empresa_id: p.empresa_id || null,
  kit: p.kit_codigo || '',
  posto: p.posto || '',
  estado: p.status || p.status_id || '',
  data_entrada: toDate(p.data_entrada),
  data_colheita: toDate(p.data_colheita),
  data_resultado: toDate(p.data_resultado),
  valor: Number(p.valor_final || 0),
});

const mapResultado = (p) => ({
  id: p.id,
  numero: p.numero_processo || '',
  paciente: p.paciente_nome || '',
  paciente_id: p.paciente_id || null,
  teste: p.teste_nome || '',
  estado: p.status || p.status_id || '',
  resultado: bool(p.resultado_tudo_ok) ? 'Tudo OK' : 'Com anomalia',
  validado: p.data_validacao ? 'Sim' : 'Nao',
  data_resultado: toDate(p.data_resultado),
});

const mapFaturacao = (p) => ({
  id: p.id,
  fatura_numero: p.fatura_numero || '',
  numero: p.numero_processo || '',
  paciente: p.paciente_nome || '',
  empresa: p.empresa_nome || '',
  empresa_id: p.empresa_id || null,
  valor: Number(p.valor_final || 0),
  data_emissao: toDate(p.fatura_data_emissao),
  pago: p.pagamento_data ? 'Sim' : 'Nao',
});

const FASE_CICLO_LABEL = {
  em_empresa: 'Em empresa',
  em_posto_aguarda: 'Em posto (aguarda)',
  reservado_colheita: 'Reservado colheita',
  aguarda_envio_lab: 'Aguarda envio lab',
  em_transito_lab: 'Em trânsito p/ lab',
  em_lab_final: 'Em lab final',
  encerrado: 'Encerrado',
};

const mapKit = (k) => ({
  id: k.id,
  codigo: k.codigo_barras || '',
  tipo: k.tipo_kit_nome || '',
  teste: k.teste_pai_nome || k.teste_nome || '',
  lote: k.codigo_lote || '',
  estado: k.status || '',
  localizacao: k.localizacao || '',
  fase_ciclo: FASE_CICLO_LABEL[k.fase_ciclo] || k.fase_ciclo || '',
  validade: toDate(k.data_validade),
});

const mapLote = (l) => ({
  id: l.id,
  codigo: l.codigo_lote || '',
  tipo: l.tipo_kit_nome || '',
  fornecedor: l.fornecedor_nome || '',
  quantidade: Number(l.quantidade || 0),
  kits_total: Number(l.kits_total || 0),
  kits_disponiveis: Number(l.kits_disponiveis || 0),
  estado: l.estado || '',
  validade: toDate(l.validade || l.data_validade_max),
});

const mapColheita = (c) => ({
  id: c.id,
  processo_id: c.processo_id || null,
  numero: c.numero_processo || '',
  paciente: c.paciente_nome || '',
  posto: c.posto_nome || '',
  kit: c.kit_codigo || '',
  estado: c.processo_status || '',
  periodo: c.periodo || '',
  data_prevista: toDate(c.data_prevista),
});

const mapPaciente = (p) => ({
  id: p.id,
  nome: p.nome || '',
  nif: p.nif || '',
  telemovel: p.telemovel || '',
  email: p.email || '',
  processos_total: Number(p.processos_total || 0),
});

const mapMedico = (m) => ({
  id: m.id,
  nome: m.nome || '',
  num_ordem: m.num_ordem || '',
  especialidade: m.especialidade || '',
  email: m.email || '',
  telefone: m.telefone || '',
  processos_total: Number(m.processos_total || 0),
});

const mapAuditoria = (l) => ({
  id: l.id,
  data: l.data ? new Date(l.data).toISOString() : '',
  utilizador: l.utilizador_nome || '',
  acao: l.acao || '',
  tabela: l.tabela_afetada || '',
  registro_id: l.registro_id || '',
});

const buildColheitaPrevistaMap = (colheitas) => {
  const map = new Map();
  for (const c of colheitas) {
    if (!c.processo_id) continue;
    const d = toDate(c.data_prevista);
    if (!d) continue;
    const prev = map.get(c.processo_id);
    if (!prev || d < prev) map.set(c.processo_id, d);
  }
  return map;
};

const mapPainelBordo = (p, colheitaPrevistaMap) => {
  const status = p.status || p.status_id || '';
  const sla = Number(p.tempo_resposta_dias) || 15;
  const chegada = toDate(p.data_chegada_laboratorio);
  const colheita = toDate(p.data_colheita);

  return {
    id: p.id,
    paciente_id: p.paciente_id || null,
    nome_mae: p.paciente_nome || '',
    teste: p.teste_nome || '',
    data_registo: toDate(p.data_entrada),
    data_factura: toDate(p.fatura_data_emissao),
    data_pagamento: toDate(p.pagamento_data),
    colheita_prevista: colheitaPrevistaMap.get(p.id) || toDate(p.data_colheita_prevista) || '',
    colheita_efetiva: colheita,
    processo: p.numero_processo || '',
    envio_laboratorio: LAB_ENVIADO_STATUSES.has(status) && colheita ? colheita : '',
    recepcao_laboratorio: chegada,
    data_prev_relatorio: chegada ? addCalendarDays(chegada, sla) : '',
    data_relatorio: toDate(p.data_resultado),
    envio_relatorio: toDate(p.data_envio_relatorio),
    estado: status,
    medico: p.medico_nome || '',
    empresa: p.empresa_nome || '',
  };
};

// ---------------------------------------------------------------------------
// Registry das listagens
// ---------------------------------------------------------------------------

const LISTINGS = {
  painel_bordo: {
    label: 'Painel de Bordo',
    dateField: 'data_registo',
    searchFields: ['nome_mae', 'teste', 'processo', 'medico', 'empresa', 'estado'],
    columns: [
      ['nome_mae', 'Nome da mãe'],
      ['teste', 'Teste'],
      ['data_registo', 'Data registo'],
      ['data_factura', 'Data factura'],
      ['data_pagamento', 'Data pagamento'],
      ['colheita_prevista', 'Colheita prevista'],
      ['colheita_efetiva', 'Colheita efectiva'],
      ['processo', 'Processo'],
      ['envio_laboratorio', 'Envio Laboratório'],
      ['recepcao_laboratorio', 'Recepção Laboratório'],
      ['data_prev_relatorio', 'Data prev. Relatório'],
      ['data_relatorio', 'Data Relatório'],
      ['envio_relatorio', 'Envio Relatório'],
    ],
    load: async (user) => {
      const [processos, colheitas] = await Promise.all([
        processosService.listAll(user),
        colheitasRepository.findAll({}),
      ]);
      const colheitaPrevistaMap = buildColheitaPrevistaMap(colheitas);
      return processos
        .filter((p) => (p.status || p.status_id || '') !== 'Cancelado')
        .map((p) => mapPainelBordo(p, colheitaPrevistaMap));
    },
  },
  processos: {
    label: 'Processos',
    dateField: 'data_entrada',
    searchFields: ['numero', 'paciente', 'medico', 'teste', 'kit', 'posto', 'estado'],
    columns: [
      ['numero', 'Nº Processo'], ['paciente', 'Paciente'], ['medico', 'Medico'],
      ['teste', 'Teste'], ['kit', 'Kit'], ['posto', 'Posto'], ['estado', 'Estado'],
      ['data_entrada', 'Data Entrada'], ['data_resultado', 'Data Resultado'], ['valor', 'Valor (EUR)'],
    ],
    load: async (user) => (await processosService.listAll(user)).map(mapProcesso),
  },
  resultados: {
    label: 'Resultados',
    dateField: 'data_resultado',
    searchFields: ['numero', 'paciente', 'teste', 'estado', 'resultado'],
    columns: [
      ['numero', 'Nº Processo'], ['paciente', 'Paciente'], ['teste', 'Teste'],
      ['resultado', 'Resultado'], ['validado', 'Validado'], ['estado', 'Estado'], ['data_resultado', 'Data Resultado'],
    ],
    load: async (user) => (await processosService.listAll(user))
      .filter((p) => p.data_resultado)
      .map(mapResultado),
  },
  faturacao: {
    label: 'Faturacao',
    dateField: 'data_emissao',
    searchFields: ['fatura_numero', 'numero', 'paciente', 'empresa'],
    columns: [
      ['fatura_numero', 'Nº Fatura'], ['numero', 'Nº Processo'], ['paciente', 'Paciente'],
      ['empresa', 'Empresa'], ['valor', 'Valor (EUR)'], ['data_emissao', 'Data Emissao'], ['pago', 'Pago'],
    ],
    load: async (user) => (await processosService.listAll(user))
      .filter((p) => bool(p.fatura_emitida))
      .map(mapFaturacao),
  },
  pacientes: {
    label: 'Pacientes',
    dateField: null,
    searchFields: ['nome', 'nif', 'telemovel', 'email'],
    columns: [
      ['nome', 'Nome'], ['nif', 'NIF'], ['telemovel', 'Telemovel'], ['email', 'Email'], ['processos_total', 'Nº Processos'],
    ],
    load: async (user) => {
      if (await isMedicoUser(user)) {
        return (await pacientesService.listAll(user)).map(mapPaciente);
      }
      return (await listagensRepository.pacientesComVolume(user.empresa_id || null)).map(mapPaciente);
    },
  },
  medicos: {
    label: 'Medicos',
    dateField: null,
    searchFields: ['nome', 'num_ordem', 'especialidade', 'email'],
    columns: [
      ['nome', 'Nome'], ['num_ordem', 'Nº Ordem'], ['especialidade', 'Especialidade'],
      ['email', 'Email'], ['telefone', 'Telefone'], ['processos_total', 'Nº Processos'],
    ],
    load: async (user) => (await listagensRepository.medicosComVolume(user.empresa_id || null)).map(mapMedico),
  },
  kits: {
    label: 'Kits',
    dateField: 'validade',
    searchFields: ['codigo', 'tipo', 'teste', 'lote', 'estado', 'localizacao', 'fase_ciclo'],
    columns: [
      ['codigo', 'Codigo'], ['tipo', 'Tipo'], ['teste', 'Teste'], ['lote', 'Lote'], ['estado', 'Estado'],
      ['fase_ciclo', 'Fase ciclo'], ['localizacao', 'Localizacao'], ['validade', 'Validade'],
    ],
    load: async () => (await stocksRepository.findKits()).map(mapKit),
  },
  lotes: {
    label: 'Lotes',
    dateField: 'validade',
    searchFields: ['codigo', 'tipo', 'fornecedor', 'estado'],
    columns: [
      ['codigo', 'Codigo'], ['tipo', 'Tipo'], ['fornecedor', 'Fornecedor'], ['quantidade', 'Quantidade'],
      ['kits_disponiveis', 'Disponiveis'], ['kits_total', 'Total Kits'], ['estado', 'Estado'], ['validade', 'Validade'],
    ],
    load: async () => (await stocksRepository.findLotes()).map(mapLote),
  },
  colheitas: {
    label: 'Colheitas',
    dateField: 'data_prevista',
    searchFields: ['numero', 'paciente', 'posto', 'kit', 'estado'],
    columns: [
      ['numero', 'Nº Processo'], ['paciente', 'Paciente'], ['posto', 'Posto'], ['kit', 'Kit'],
      ['estado', 'Estado'], ['periodo', 'Periodo'], ['data_prevista', 'Data Prevista'],
    ],
    load: async (user) => (await colheitasService.listForReporting(user)).map(mapColheita),
  },
  auditoria: {
    label: 'Auditoria',
    dateField: 'data',
    searchFields: ['utilizador', 'acao', 'tabela'],
    columns: [
      ['data', 'Data'], ['utilizador', 'Utilizador'], ['acao', 'Acao'], ['tabela', 'Tabela'], ['registro_id', 'Registo'],
    ],
    load: async () => (await logRepository.findAll()).map(mapAuditoria),
  },
};

exports.LISTINGS = LISTINGS;
exports.LISTING_KEYS = Object.keys(LISTINGS);

const getConfig = (listing) => {
  const cfg = LISTINGS[listing];
  if (!cfg) throw new Error(`Listagem invalida. Validas: ${Object.keys(LISTINGS).join(', ')}`);
  return cfg;
};

// ---------------------------------------------------------------------------
// Pesquisa, filtros, ordenacao e paginacao (genericos, em memoria)
// ---------------------------------------------------------------------------

const applySearch = (rows, q, fields) => {
  const needle = norm(q);
  if (!needle) return rows;
  return rows.filter((r) => fields.some((f) => norm(r[f]).includes(needle)));
};

const applyFilters = (rows, query, cfg) => {
  let out = rows;
  const has = (k) => query[k] !== undefined && query[k] !== null && String(query[k]).trim() !== '';

  if (has('estado')) {
    const want = norm(query.estado);
    out = out.filter((r) => norm(r.estado) === want);
  }
  if (has('fase_ciclo')) {
    const want = norm(query.fase_ciclo);
    out = out.filter((r) => norm(r.fase_ciclo) === want);
  }
  // Filtros de texto (substring) por campos comuns
  ['medico', 'posto', 'empresa', 'teste', 'tipo', 'localizacao', 'fornecedor', 'especialidade', 'tabela', 'utilizador'].forEach((k) => {
    if (has(k)) {
      const want = norm(query[k]);
      out = out.filter((r) => norm(r[k]).includes(want));
    }
  });
  // Filtros booleanos derivados
  if (has('pago')) {
    const want = norm(query.pago);
    out = out.filter((r) => norm(r.pago) === want);
  }
  if (has('validado')) {
    const want = norm(query.validado);
    out = out.filter((r) => norm(r.validado) === want);
  }
  // Intervalo de datas sobre o campo de data primario da listagem
  if (cfg.dateField && (has('data_de') || has('data_ate'))) {
    const de = has('data_de') ? toDate(query.data_de) : null;
    const ate = has('data_ate') ? toDate(query.data_ate) : null;
    out = out.filter((r) => {
      const d = toDate(r[cfg.dateField]);
      if (!d) return false;
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      return true;
    });
  }
  return out;
};

const applySort = (rows, sort, dir) => {
  if (!sort) return rows;
  const factor = norm(dir) === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return norm(av).localeCompare(norm(bv)) * factor;
  });
};

/**
 * Devolve uma pagina filtrada/ordenada de uma listagem.
 */
exports.getListing = async (listing, query = {}, user = {}) => {
  const cfg = getConfig(listing);
  const all = await cfg.load(user);
  const searched = applySearch(all, query.q, cfg.searchFields);
  const filtered = applyFilters(searched, query, cfg);
  const sorted = applySort(filtered, query.sort, query.dir);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 25));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const data = sorted.slice(offset, offset + limit);

  return {
    data,
    columns: cfg.columns.map(([key, header]) => ({ key, header })),
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Versao completa (sem paginacao) para exportacao, respeitando filtros/pesquisa.
 */
exports.getFullListing = async (listing, query = {}, user = {}) => {
  const cfg = getConfig(listing);
  const all = await cfg.load(user);
  const searched = applySearch(all, query.q, cfg.searchFields);
  const filtered = applyFilters(searched, query, cfg);
  const sorted = applySort(filtered, query.sort, query.dir);
  return { data: sorted, columns: cfg.columns.map(([key, header]) => ({ key, header })), label: cfg.label };
};

// ---------------------------------------------------------------------------
// Pesquisa global multi-entidade
// ---------------------------------------------------------------------------

exports.search = async (q, user = {}) => {
  const needle = norm(q);
  if (!needle || needle.length < 2) return { grupos: [] };

  const top = (arr) => arr.slice(0, 6);

  const [processos, pacientes, medicos, kits, lotes] = await Promise.all([
    LISTINGS.processos.load(user),
    LISTINGS.pacientes.load(user),
    LISTINGS.medicos.load(user),
    LISTINGS.kits.load(user),
    LISTINGS.lotes.load(user),
  ]);

  const matchProc = top(processos.filter((p) =>
    norm(p.numero).includes(needle) || norm(p.paciente).includes(needle) ||
    norm(p.medico).includes(needle) || norm(p.kit).includes(needle) || norm(p.teste).includes(needle)));
  const resultados = top(processos.filter((p) => p.data_resultado &&
    (norm(p.numero).includes(needle) || norm(p.paciente).includes(needle))));
  const matchPac = top(pacientes.filter((p) => norm(p.nome).includes(needle) || norm(p.nif).includes(needle)));
  const matchMed = top(medicos.filter((m) => norm(m.nome).includes(needle) || norm(m.num_ordem).includes(needle)));
  const matchKit = top(kits.filter((k) => norm(k.codigo).includes(needle) || norm(k.lote).includes(needle)));
  const matchLote = top(lotes.filter((l) => norm(l.codigo).includes(needle) || norm(l.fornecedor).includes(needle)));

  const grupos = [];
  const pushGroup = (tipo, label, items, toResult) => {
    if (items.length) grupos.push({ tipo, label, itens: items.map(toResult) });
  };

  pushGroup('processo', 'Processos', matchProc, (p) => ({
    id: p.id, label: p.numero || 'Processo', sublabel: `${p.paciente} · ${p.estado}`,
    target: { listing: 'processos', module: 'processos', id: p.id },
  }));
  pushGroup('resultado', 'Resultados', resultados, (p) => ({
    id: p.id, label: p.numero || 'Resultado', sublabel: `${p.paciente} · ${toDate(p.data_resultado)}`,
    target: { listing: 'resultados', module: 'processos', id: p.id },
  }));
  pushGroup('paciente', 'Pacientes', matchPac, (p) => ({
    id: p.id, label: p.nome, sublabel: p.nif ? `NIF ${p.nif}` : `${p.processos_total} processos`,
    target: { listing: 'pacientes', module: 'processos', id: p.id, paciente_id: p.id },
  }));
  pushGroup('medico', 'Medicos', matchMed, (m) => ({
    id: m.id, label: m.nome, sublabel: m.especialidade || (m.num_ordem ? `Ordem ${m.num_ordem}` : ''),
    target: { listing: 'medicos', module: 'processos', id: m.id },
  }));
  pushGroup('kit', 'Kits', matchKit, (k) => ({
    id: k.id, label: k.codigo, sublabel: `${k.tipo || ''} · ${k.estado}`,
    target: { listing: 'kits', module: 'stocks', id: k.id, trace: 'kit' },
  }));
  pushGroup('lote', 'Lotes', matchLote, (l) => ({
    id: l.id, label: l.codigo, sublabel: l.fornecedor || `${l.kits_total} kits`,
    target: { listing: 'lotes', module: 'stocks', id: l.id, trace: 'lote' },
  }));

  return { grupos };
};
