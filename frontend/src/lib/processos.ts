import { Processo } from '../app/data/types';

export type EstadoProcesso = Processo['estado'];

export type ProcessTimelineStepState = 'done' | 'current' | 'upcoming' | 'cancelled';

export interface ProcessTimelineStep {
  id: string;
  label: string;
  date?: string | null;
  state: ProcessTimelineStepState;
}

/** Código do kit no processo (numero_processo costuma ser o código do kit na conversão contacto→processo). */
export const resolveProcessoKitCodigo = (
  p: Pick<Processo, 'kit_codigo' | 'numero'>,
): string => (p.kit_codigo?.trim() || p.numero?.trim() || '');

/** Estados visíveis no pipeline da página Processos (agrupados por coluna). */
export const PROCESS_PIPELINE_ESTADOS: EstadoProcesso[] = [
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
];

/** Colunas do kanban — colheita integrada na etapa de envio ao laboratório. */
export const PROCESS_PIPELINE_COLUMNS: {
  key: string;
  label: string;
  estados: EstadoProcesso[];
}[] = [
  {
    key: 'lab_analise',
    label: 'Enviado ao Laboratório p/ Análise',
    estados: ['Colheita Realizada', 'Enviado Laboratorio', 'Em Analise'],
  },
  { key: 'Resultado Disponivel', label: 'Resultado Disponivel', estados: ['Resultado Disponivel'] },
  { key: 'Validado', label: 'Validado', estados: ['Validado'] },
  { key: 'Faturado', label: 'Faturado', estados: ['Faturado'] },
];

/** Filtros/chips da pagina Processos (estados agrupados). */
export const PROCESSOS_PAGE_ESTADOS: { key: string; estados: EstadoProcesso[] }[] = [
  ...PROCESS_PIPELINE_COLUMNS.map((c) => ({ key: c.key, estados: c.estados })),
  { key: 'Cancelado', estados: ['Cancelado'] },
];

/** Coluna do kanban para processos cancelados (só visível com filtro activo). */
export const PROCESS_PIPELINE_CANCELADO_COLUMN = {
  key: 'Cancelado',
  label: 'Cancelado',
  estados: ['Cancelado'] as EstadoProcesso[],
};

/** Colunas possíveis no pipeline (inclui cancelados). */
export const ALL_PIPELINE_DISPLAY_COLUMNS = [
  ...PROCESS_PIPELINE_COLUMNS,
  PROCESS_PIPELINE_CANCELADO_COLUMN,
];

/** Com filtro de estado activo, mostra só a coluna correspondente. */
export const getVisiblePipelineColumns = (filterKey?: string) => {
  if (!filterKey) return PROCESS_PIPELINE_COLUMNS;
  const match = ALL_PIPELINE_DISPLAY_COLUMNS.find((c) => c.key === filterKey);
  if (match) return [match];
  const entry = PROCESSOS_PAGE_ESTADOS.find((e) => e.key === filterKey);
  if (!entry) return PROCESS_PIPELINE_COLUMNS;
  return [{
    key: entry.key,
    label: ESTADO_LABEL[entry.estados[0]] ?? entry.key,
    estados: entry.estados,
  }];
};

export const processoMatchesEstadoFilter = (estado: EstadoProcesso, filterKey: string): boolean => {
  const entry = PROCESSOS_PAGE_ESTADOS.find((e) => e.key === filterKey);
  return entry ? entry.estados.includes(estado) : estado === filterKey;
};

/** Pipeline completo (inclui fases de contacto, para transicoes legacy). */
export const PIPELINE_ESTADOS: EstadoProcesso[] = [
  'Agendado',
  'Kit Reservado',
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
];

/** Passos unificados do workflow (sem repetir «Enviado ao Laboratório»). */
const WORKFLOW_STEP_DEFS: { id: string; label: string; getDate: (p: Processo) => string | null | undefined }[] = [
  { id: 'agendado', label: 'Agendado', getDate: (p) => p.data_entrada },
  { id: 'kit', label: 'Kit Reservado', getDate: () => undefined },
  { id: 'colheita', label: 'Colheita Realizada', getDate: (p) => p.data_colheita },
  { id: 'lab', label: 'Enviado ao Laboratório p/ Análise', getDate: (p) => p.data_envio_laboratorio || p.data_chegada_laboratorio },
  { id: 'resultado', label: 'Resultado Disponivel', getDate: (p) => p.data_resultado },
  { id: 'validado', label: 'Validado', getDate: (p) => p.data_validacao },
  { id: 'faturado', label: 'Faturado', getDate: (p) => p.fatura_data_emissao },
];

/** Índice do passo actual no workflow (Colheita Realizada conta como etapa de laboratório no pipeline). */
const WORKFLOW_STEP_INDEX: Record<EstadoProcesso, number> = {
  Agendado: 0,
  'Kit Reservado': 1,
  'Colheita Realizada': 3,
  'Enviado Laboratorio': 3,
  'Em Analise': 3,
  'Resultado Disponivel': 4,
  Validado: 5,
  Faturado: 6,
  Cancelado: -1,
};

export const buildProcessWorkflowSteps = (p: Processo): ProcessTimelineStep[] => {
  if (p.estado === 'Cancelado') {
    return WORKFLOW_STEP_DEFS.map((step) => ({
      id: step.id,
      label: step.label,
      date: step.getDate(p),
      state: 'cancelled',
    }));
  }
  const currentIdx = WORKFLOW_STEP_INDEX[p.estado] ?? 0;
  return WORKFLOW_STEP_DEFS.map((step, i) => ({
    id: step.id,
    label: step.label,
    date: step.getDate(p),
    state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming',
  }));
};

const HISTORICO_EVENT_DEFS: { id: string; label: string; getDate: (p: Processo) => string | null | undefined }[] = [
  { id: 'entrada', label: 'Entrada / agendamento', getDate: (p) => p.data_entrada },
  { id: 'colheita', label: 'Colheita realizada', getDate: (p) => p.data_colheita },
  { id: 'envio_lab', label: 'Envio ao laboratório p/ análise', getDate: (p) => p.data_envio_laboratorio },
  {
    id: 'chegada_lab',
    label: 'Chegada ao laboratório',
    getDate: (p) => {
      const chegada = p.data_chegada_laboratorio;
      if (!chegada) return undefined;
      if (p.data_envio_laboratorio && chegada === p.data_envio_laboratorio) return undefined;
      return chegada;
    },
  },
  { id: 'resultado', label: 'Resultado disponível', getDate: (p) => p.data_resultado },
  { id: 'validacao', label: 'Validação clínica', getDate: (p) => p.data_validacao },
  { id: 'relatorio', label: 'Envio de relatório', getDate: (p) => p.data_envio_relatorio },
  {
    id: 'fatura',
    label: 'Fatura emitida',
    getDate: (p) => (p.fatura_emitida && p.fatura_data_emissao ? p.fatura_data_emissao : undefined),
  },
  { id: 'pagamento', label: 'Pagamento', getDate: (p) => p.pagamento_data },
];

/** Histórico cronológico — só eventos com data registada, sem repetições. */
export const buildProcessHistoricoSteps = (p: Processo): ProcessTimelineStep[] => {
  const events = HISTORICO_EVENT_DEFS
    .map((event) => ({
      id: event.id,
      label: event.label,
      date: event.getDate(p),
    }))
    .filter((event): event is { id: string; label: string; date: string } => !!event.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) return [];

  const cancelled = p.estado === 'Cancelado';
  return events.map((event, i) => ({
    ...event,
    state: cancelled ? 'cancelled' : i === events.length - 1 ? 'current' : 'done',
  }));
};

export const TODOS_ESTADOS: EstadoProcesso[] = [...PIPELINE_ESTADOS, 'Cancelado'];

export const PROCESSOS_PAGE_ESTADOS_LEGACY: EstadoProcesso[] = [...PROCESS_PIPELINE_ESTADOS, 'Cancelado'];

/** @deprecated Use PROCESSOS_PAGE_ESTADOS com chaves agrupadas. */
export const PROCESSOS_PAGE_ESTADO_KEYS = PROCESSOS_PAGE_ESTADOS.map((e) => e.key);

/** Espelha TRANSICOES_VALIDAS do backend (processos.service.js). */
export const TRANSICOES_VALIDAS: Record<EstadoProcesso, EstadoProcesso[]> = {
  Agendado: ['Kit Reservado', 'Cancelado'],
  'Kit Reservado': ['Colheita Realizada', 'Agendado', 'Cancelado'],
  'Colheita Realizada': ['Em Analise', 'Cancelado'],
  'Enviado Laboratorio': ['Resultado Disponivel', 'Cancelado'],
  'Em Analise': ['Resultado Disponivel', 'Cancelado'],
  'Resultado Disponivel': ['Validado', 'Cancelado'],
  Validado: ['Faturado', 'Cancelado'],
  Faturado: [],
  Cancelado: [],
};

export const proximosEstados = (atual: EstadoProcesso): EstadoProcesso[] => TRANSICOES_VALIDAS[atual] ?? [];

export const podeTransitar = (de: EstadoProcesso, para: EstadoProcesso): boolean =>
  proximosEstados(de).includes(para);

export const ESTADO_LABEL: Record<EstadoProcesso, string> = {
  Agendado: 'Agendado',
  'Kit Reservado': 'Kit Reservado',
  'Colheita Realizada': 'Colheita Realizada',
  'Enviado Laboratorio': 'Enviado ao Laboratório p/ Análise',
  'Em Analise': 'Enviado ao Laboratório p/ Análise',
  'Resultado Disponivel': 'Resultado Disponivel',
  Validado: 'Validado',
  Faturado: 'Faturado',
  Cancelado: 'Cancelado',
};

/** Rotulo da acao para avancar para um determinado estado. */
export const ACAO_LABEL: Partial<Record<EstadoProcesso, string>> = {
  'Kit Reservado': 'Reservar kit',
  'Colheita Realizada': 'Registar colheita',
  'Em Analise': 'Enviar ao laboratório para análise',
  'Resultado Disponivel': 'Registar resultado',
  Validado: 'Validar',
  Faturado: 'Emitir fatura',
  Cancelado: 'Cancelar',
};

const MS_DIA = 1000 * 60 * 60 * 24;

export const diasDesde = (date?: string | null): number | null => {
  if (!date) return null;
  const d = new Date(date).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / MS_DIA);
};

/** TAT em dias entre colheita e resultado (ou ate hoje se ainda sem resultado). */
export const tatDias = (p: Processo): number | null => {
  if (!p.data_colheita) return null;
  const inicio = new Date(p.data_colheita).getTime();
  const fim = p.data_resultado ? new Date(p.data_resultado).getTime() : Date.now();
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return null;
  return Math.max(0, Math.round((fim - inicio) / MS_DIA));
};

const ESTADO_TERMINAL = (e: EstadoProcesso) => e === 'Faturado' || e === 'Cancelado';

/** Data de referencia da ultima transicao conhecida (para deteccao de "parado"). */
export const ultimaAtualizacao = (p: Processo): string | undefined =>
  p.data_envio_relatorio || p.data_validacao || p.data_resultado ||
  p.data_chegada_laboratorio || p.data_envio_laboratorio || p.data_colheita || p.data_entrada;

/** Processo "atrasado": parado ha mais de N dias num estado nao-terminal. */
export const isAtrasado = (p: Processo, limiteDias = 7): boolean => {
  if (ESTADO_TERMINAL(p.estado)) return false;
  const dias = diasDesde(ultimaAtualizacao(p));
  return dias !== null && dias > limiteDias;
};

export const isResultadoPorValidar = (p: Processo): boolean => p.estado === 'Resultado Disponivel';

export const isRelatorioPorEnviar = (p: Processo): boolean =>
  !!p.relatorio_validado && !p.data_envio_relatorio && p.estado !== 'Cancelado';

export const isFaturaPorEmitir = (p: Processo): boolean => p.estado === 'Validado' && !p.fatura_emitida;

export const isFaturaPorPagar = (p: Processo): boolean => !!p.fatura_emitida && !p.pagamento_data;

export const isAtivo = (p: Processo): boolean => p.estado !== 'Faturado' && p.estado !== 'Cancelado';

export const isAntigo = (p: Processo): boolean => !isAtivo(p);

/** Data de referência para ordenar processos concluídos. */
export const resolveDataConclusao = (p: Processo): string | undefined =>
  p.data_conclusao || p.data_anulacao || p.fatura_data_emissao || p.data_validacao || p.data_entrada;
