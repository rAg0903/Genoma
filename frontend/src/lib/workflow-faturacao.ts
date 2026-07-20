import { Contact, Processo } from '../app/data/types';
import { formatCalendarDatePt, normalizeCalendarDate } from './dates';

export type WorkflowMilestoneDates = {
  data_entrada?: string | null;
  data_colheita?: string | null;
  data_envio_laboratorio?: string | null;
  data_chegada_laboratorio?: string | null;
  data_resultado?: string | null;
  data_validacao?: string | null;
};

const workflowDateTs = (value?: string | null): number | null => {
  const normalized = normalizeCalendarDate(value);
  if (!normalized) return null;
  const ts = new Date(`${normalized}T12:00:00`).getTime();
  return Number.isNaN(ts) ? null : ts;
};

/** Data usada no passo «Faturação» do workflow (só emissão, não pagamento). */
export const getWorkflowFaturacaoDate = (data: {
  fatura_data_emissao?: string | null;
}): string | null => normalizeCalendarDate(data.fatura_data_emissao) || null;

export const workflowDatesFromProcesso = (
  processo: Pick<
    Processo,
    | 'data_entrada'
    | 'data_colheita'
    | 'data_envio_laboratorio'
    | 'data_chegada_laboratorio'
    | 'data_resultado'
    | 'data_validacao'
  >,
): WorkflowMilestoneDates => ({
  data_entrada: processo.data_entrada || null,
  data_colheita: processo.data_colheita || null,
  data_envio_laboratorio: processo.data_envio_laboratorio || null,
  data_chegada_laboratorio: processo.data_chegada_laboratorio || null,
  data_resultado: processo.data_resultado || null,
  data_validacao: processo.data_validacao || null,
});

export const workflowDatesFromContact = (
  contact: Pick<Contact, 'created_at' | 'colheita_data_efetiva' | 'data_colheita_prevista'>,
  processo?: Pick<
    Processo,
    | 'data_entrada'
    | 'data_colheita'
    | 'data_envio_laboratorio'
    | 'data_chegada_laboratorio'
    | 'data_resultado'
    | 'data_validacao'
  > | null,
): WorkflowMilestoneDates => {
  if (processo) return workflowDatesFromProcesso(processo);
  return {
    data_entrada: normalizeCalendarDate(contact.created_at) || null,
    data_colheita: contact.colheita_data_efetiva || contact.data_colheita_prevista || null,
  };
};

const FATURACAO_INSERT_ANCHORS: {
  afterIndex: number;
  getDate: (dates: WorkflowMilestoneDates) => string | null | undefined;
}[] = [
  { afterIndex: 1, getDate: (d) => d.data_entrada },
  { afterIndex: 2, getDate: (d) => d.data_colheita },
  { afterIndex: 3, getDate: (d) => d.data_envio_laboratorio || d.data_chegada_laboratorio },
  { afterIndex: 4, getDate: (d) => d.data_resultado },
  { afterIndex: 5, getDate: (d) => d.data_validacao },
];

/** Índice do passo clínico após o qual a faturação deve aparecer no workflow. */
export const resolveFaturacaoWorkflowInsertAfterIndex = (
  dates: WorkflowMilestoneDates,
  faturaDate?: string | null,
): number => {
  const faturaTs = workflowDateTs(faturaDate);
  if (faturaTs === null) return 5;

  let insertAfter = 1;
  for (const anchor of FATURACAO_INSERT_ANCHORS) {
    const anchorTs = workflowDateTs(anchor.getDate(dates));
    if (anchorTs !== null && faturaTs >= anchorTs) {
      insertAfter = anchor.afterIndex;
    }
  }
  return insertAfter;
};

/** Data mínima coerente para emissão da fatura no contexto do workflow. */
export const resolveFaturacaoWorkflowMinDate = (dates: WorkflowMilestoneDates): string | undefined =>
  normalizeCalendarDate(dates.data_entrada) || undefined;

/** Garante que a data de emissão respeita o início do processo. */
export const sanitizeFaturacaoDataEmissao = (
  dates: WorkflowMilestoneDates,
  faturaDate?: string | null,
): string => {
  const normalized = normalizeCalendarDate(faturaDate);
  if (!normalized) return '';
  const minDate = resolveFaturacaoWorkflowMinDate(dates);
  if (minDate && normalized < minDate) return '';
  return normalized;
};

export const describeFaturacaoWorkflowPlacement = (
  dates: WorkflowMilestoneDates,
  faturaDate?: string | null,
): string | null => {
  const normalized = getWorkflowFaturacaoDate({ fatura_data_emissao: faturaDate });
  if (!normalized) return null;

  const placement: Record<number, string> = {
    1: 'após o agendamento',
    2: 'após a colheita',
    3: 'entre envio ao laboratório e resultado disponível',
    4: 'entre resultado disponível e validação',
    5: 'após a validação',
  };

  const after = resolveFaturacaoWorkflowInsertAfterIndex(dates, normalized);
  return placement[after] ?? null;
};

/** Valida se a data de faturação é coerente com o workflow clínico. */
export const validateFaturacaoWorkflowDate = (
  dates: WorkflowMilestoneDates,
  faturaDate?: string | null,
): string | null => {
  const normalized = getWorkflowFaturacaoDate({ fatura_data_emissao: faturaDate });
  if (!normalized) return null;

  const minDate = resolveFaturacaoWorkflowMinDate(dates);
  if (minDate && normalized < minDate) {
    return `A data de faturação não pode ser anterior ao início do processo (${formatCalendarDatePt(minDate)}).`;
  }

  return null;
};
