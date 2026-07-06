import { Processo } from '../app/data/types';
import { EstadoProcesso } from './processos';

export type ProcessDataIssue = {
  id: string;
  messageKey: string;
  severity: 'warning' | 'info';
};

export function getProcessDataQualityIssues(processo: Processo): ProcessDataIssue[] {
  if (processo.estado === 'Cancelado' || processo.estado === 'Faturado') return [];

  const issues: ProcessDataIssue[] = [];

  if (!processo.posto?.trim()) {
    issues.push({ id: 'missing_posto', messageKey: 'ux.dataQuality.missingPosto', severity: 'warning' });
  }

  if (!processo.data_colheita?.trim() && !processo.data_colheita_prevista?.trim()) {
    issues.push({ id: 'missing_colheita_date', messageKey: 'ux.dataQuality.missingColheitaDate', severity: 'warning' });
  }

  const labStates: EstadoProcesso[] = ['Em Analise', 'Enviado Laboratorio', 'Resultado Disponivel', 'Validado'];
  if (
    labStates.includes(processo.estado)
    && !processo.data_envio_laboratorio?.trim()
    && !processo.data_chegada_laboratorio?.trim()
  ) {
    issues.push({ id: 'missing_lab_send', messageKey: 'ux.dataQuality.missingLabSend', severity: 'warning' });
  }

  return issues;
}

/** Transições que exigem confirmação explícita (além de cancelamento). */
export const TRANSITION_CONFIRM_TARGETS: EstadoProcesso[] = [
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
];

export function needsTransitionConfirm(destino: EstadoProcesso): boolean {
  return TRANSITION_CONFIRM_TARGETS.includes(destino);
}

/** Processos atribuídos ao médico autenticado (por nome no campo médico). */
export function processoMatchesMedico(
  processo: Processo,
  medicoNome?: string | null,
): boolean {
  if (!medicoNome?.trim()) return true;
  const needle = medicoNome.trim().toLowerCase();
  const hay = (processo.medico || '').trim().toLowerCase();
  if (!hay) return false;
  return hay === needle || hay.includes(needle) || needle.includes(hay);
}
