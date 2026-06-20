import { Processo } from '../app/data/types';

export type EstadoProcesso = Processo['estado'];

/** Pipeline visivel na pagina Processos (apos colheita com kit). */
export const PROCESS_PIPELINE_ESTADOS: EstadoProcesso[] = [
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
];

/** Pipeline completo (inclui fases de contacto, para transicoes legacy). */
export const PIPELINE_ESTADOS: EstadoProcesso[] = [
  'Agendado',
  'Kit Reservado',
  ...PROCESS_PIPELINE_ESTADOS,
];

export const TODOS_ESTADOS: EstadoProcesso[] = [...PIPELINE_ESTADOS, 'Cancelado'];

export const PROCESSOS_PAGE_ESTADOS: EstadoProcesso[] = [...PROCESS_PIPELINE_ESTADOS, 'Cancelado'];

/** Espelha TRANSICOES_VALIDAS do backend (processos.service.js). */
export const TRANSICOES_VALIDAS: Record<EstadoProcesso, EstadoProcesso[]> = {
  Agendado: ['Kit Reservado', 'Cancelado'],
  'Kit Reservado': ['Colheita Realizada', 'Agendado', 'Cancelado'],
  'Colheita Realizada': ['Enviado Laboratorio', 'Cancelado'],
  'Enviado Laboratorio': ['Em Analise', 'Cancelado'],
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
  'Enviado Laboratorio': 'Enviado ao Laboratorio',
  'Em Analise': 'Em Analise',
  'Resultado Disponivel': 'Resultado Disponivel',
  Validado: 'Validado',
  Faturado: 'Faturado',
  Cancelado: 'Cancelado',
};

/** Rotulo da acao para avancar para um determinado estado. */
export const ACAO_LABEL: Partial<Record<EstadoProcesso, string>> = {
  'Kit Reservado': 'Reservar kit',
  'Colheita Realizada': 'Registar colheita',
  'Enviado Laboratorio': 'Enviar ao laboratorio',
  'Em Analise': 'Iniciar analise',
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
  p.data_chegada_laboratorio || p.data_colheita || p.data_entrada;

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
