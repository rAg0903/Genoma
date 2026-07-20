import { Processo } from '../app/data/types';
import { maxCalendarDate, normalizeCalendarDate, todayLocal } from './dates';
import { resolveProcessoKitCodigo } from './processos';
import {
  validateFaturacaoWorkflowDate,
  WorkflowMilestoneDates,
  workflowDatesFromProcesso,
} from './workflow-faturacao';

export type ProcessFormData = Omit<Processo, 'id'>;

export const emptyProcessForm = (): ProcessFormData => ({
  numero: '',
  paciente_id: '',
  paciente_nome: '',
  medico: '',
  posto: '',
  kit_codigo: '',
  estado: 'Em Analise',
  data_entrada: todayLocal(),
  data_colheita: '',
  data_envio_laboratorio: '',
  data_chegada_laboratorio: '',
  data_resultado: '',
  data_validacao: '',
  data_envio_relatorio: '',
  teste: '',
  observacoes: '',
  responsavel_fluxo: '',
  relatorio_validado: false,
  relatorio_enviado_para: 'Nenhum',
  resultado_tudo_ok: true,
  resultado_anomalias: '',
  fracao_fetal: '',
  fatura_emitida: false,
  fatura_numero: '',
  fatura_data_emissao: '',
  valor_base: 0,
  desconto_percentual: 0,
  valor_final: 0,
  pagamento_data: '',
  recibo_numero: '',
  pago: false,
  entidade_multibanco: '',
  referencia_multibanco: '',
  nao_gera_comissao: false,
  fatura_envio_email: '',
  fatura_envio_sms: '',
});

export const processToFormData = (processo: Processo): ProcessFormData => ({
  numero: processo.numero,
  paciente_id: processo.paciente_id,
  paciente_nome: processo.paciente_nome,
  medico: processo.medico,
  posto: processo.posto,
  kit_codigo: resolveProcessoKitCodigo(processo),
  estado: processo.estado,
  data_entrada: processo.data_entrada,
  data_colheita: processo.data_colheita || '',
  data_colheita_prevista: processo.data_colheita_prevista || '',
  data_chegada_laboratorio: processo.data_chegada_laboratorio || '',
  data_resultado: processo.data_resultado || '',
  data_validacao: processo.data_validacao || '',
  data_envio_relatorio: processo.data_envio_relatorio || '',
  teste: processo.teste,
  observacoes: processo.observacoes || '',
  responsavel_fluxo: processo.responsavel_fluxo || '',
  relatorio_validado: processo.relatorio_validado || false,
  relatorio_enviado_para: processo.relatorio_enviado_para || 'Nenhum',
  resultado_tudo_ok: processo.resultado_tudo_ok !== false,
  resultado_anomalias: processo.resultado_anomalias || '',
  fracao_fetal: processo.fracao_fetal || '',
  fatura_emitida: processo.fatura_emitida || false,
  fatura_numero: processo.fatura_numero || '',
  fatura_data_emissao: processo.fatura_data_emissao || '',
  valor_base: processo.valor_base || 0,
  desconto_percentual: processo.desconto_percentual || 0,
  valor_final: processo.valor_final || 0,
  pagamento_data: processo.pagamento_data || '',
  recibo_numero: processo.recibo_numero || '',
  pago: processo.pago || false,
  entidade_multibanco: processo.entidade_multibanco || '',
  referencia_multibanco: processo.referencia_multibanco || '',
  nao_gera_comissao: processo.nao_gera_comissao || false,
  fatura_envio_email: processo.fatura_envio_email || '',
  fatura_envio_sms: processo.fatura_envio_sms || '',
  onde_seguida: processo.onde_seguida || '',
  tipo_gravidez: processo.tipo_gravidez || null,
  gestacao_semanas_registo: processo.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: processo.gestacao_dias_registo ?? null,
  gestacao_registada_em: processo.gestacao_registada_em || '',
  motivo_anulacao_id: processo.motivo_anulacao_id || null,
  motivo_anulacao_nome: processo.motivo_anulacao_nome || undefined,
  data_anulacao: processo.data_anulacao || null,
});

export type ProcessFaturacaoData = Pick<Processo,
  | 'valor_base' | 'desconto_percentual' | 'valor_final'
  | 'fatura_numero' | 'fatura_data_emissao' | 'fatura_emitida'
  | 'entidade_multibanco' | 'referencia_multibanco' | 'nao_gera_comissao'
  | 'fatura_envio_email' | 'fatura_envio_sms'
  | 'pago' | 'pagamento_data' | 'recibo_numero'
>;

export const emptyProcessFaturacao = (): ProcessFaturacaoData => ({
  valor_base: 0,
  desconto_percentual: 0,
  valor_final: 0,
  fatura_emitida: false,
  fatura_numero: '',
  fatura_data_emissao: '',
  entidade_multibanco: '',
  referencia_multibanco: '',
  nao_gera_comissao: false,
  fatura_envio_email: '',
  fatura_envio_sms: '',
  pago: false,
  pagamento_data: '',
  recibo_numero: '',
});

export const extractFaturacaoFromProcesso = (processo: Processo): ProcessFaturacaoData => ({
  valor_base: processo.valor_base || 0,
  desconto_percentual: processo.desconto_percentual || 0,
  valor_final: processo.valor_final || 0,
  fatura_emitida: processo.fatura_emitida || false,
  fatura_numero: processo.fatura_numero || '',
  fatura_data_emissao: processo.fatura_data_emissao || '',
  entidade_multibanco: processo.entidade_multibanco || '',
  referencia_multibanco: processo.referencia_multibanco || '',
  nao_gera_comissao: processo.nao_gera_comissao || false,
  fatura_envio_email: processo.fatura_envio_email || '',
  fatura_envio_sms: processo.fatura_envio_sms || '',
  pago: processo.pago || false,
  pagamento_data: processo.pagamento_data || '',
  recibo_numero: processo.recibo_numero || '',
});

export const buildFaturacaoPayload = (data: ProcessFaturacaoData): Partial<Processo> => ({
  ...data,
  valor_final: computeValorFinal(data.valor_base ?? 0, data.desconto_percentual ?? 0),
  fatura_emitida: !!(data.fatura_numero?.trim() || data.fatura_data_emissao),
});

export const isDocumentoFaturaCompleto = (data: ProcessFaturacaoData): boolean =>
  !!(
    data.fatura_numero?.trim() &&
    data.fatura_data_emissao &&
    Number(data.valor_final ?? 0) > 0
  );

export const validateFaturacaoData = (
  data: ProcessFaturacaoData,
  workflow?: WorkflowMilestoneDates,
): string | null => {
  const faturaEmitida = !!(data.fatura_numero?.trim() || data.fatura_data_emissao);
  if (faturaEmitida && !data.fatura_data_emissao) {
    return 'Preencha a data de emissão da fatura.';
  }
  if (data.fatura_data_emissao) {
    if (!workflow) {
      return 'Não foi possível validar a data de faturação em relação ao processo.';
    }
    const workflowErr = validateFaturacaoWorkflowDate(workflow, data.fatura_data_emissao);
    if (workflowErr) return workflowErr;
  }
  if (data.pago && !isDocumentoFaturaCompleto(data)) {
    return 'Preencha o documento de fatura antes de marcar como pago.';
  }
  if (data.pagamento_data && !data.recibo_numero?.trim()) {
    return 'Preencha o número de recibo ao marcar a fatura como paga.';
  }
  if (data.pagamento_data && data.fatura_data_emissao) {
    const paymentMin = normalizeCalendarDate(data.fatura_data_emissao);
    if (normalizeCalendarDate(data.pagamento_data) < paymentMin) {
      return 'A data de pagamento não pode ser anterior à data da fatura.';
    }
  }
  if (data.pago && data.pagamento_data) {
    const paymentMin = maxCalendarDate(todayLocal(), data.fatura_data_emissao);
    if (normalizeCalendarDate(data.pagamento_data) < paymentMin) {
      return 'A data de pagamento não pode ser anterior à data de hoje nem à data da fatura.';
    }
  }
  return null;
};

export const computeValorFinal = (valorBase: number, descontoPercentual: number) =>
  Number((Number(valorBase || 0) * (1 - Number(descontoPercentual || 0) / 100)).toFixed(2));

/** Permite digitar decimais com vírgula ou ponto (ex.: «12,55»), até 2 casas decimais. */
export function sanitizeDecimalInput(raw: string, maxDecimals = 2): string {
  let out = '';
  let sepSeen = false;
  let decimals = 0;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      if (sepSeen) {
        if (decimals >= maxDecimals) continue;
        decimals += 1;
      }
      out += ch;
    } else if ((ch === ',' || ch === '.') && !sepSeen) {
      out += ch;
      sepSeen = true;
    }
  }
  return out;
}

export function parseDecimalInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized || normalized === '.') return 0;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function formatDecimalInput(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace('.', ',');
}

export const validateProcessForm = (
  formData: ProcessFormData,
  processos: Processo[],
  processoId?: string,
): string | null => {
  const estadoExigeKit = ['Colheita Realizada', 'Enviado Laboratorio', 'Em Analise', 'Resultado Disponivel', 'Validado', 'Faturado']
    .includes(formData.estado);
  if (estadoExigeKit && !resolveProcessoKitCodigo(formData)) {
    return 'Após colheita, o código único do kit é obrigatório.';
  }

  const kitCodigo = resolveProcessoKitCodigo(formData);
  const duplicateKit = kitCodigo
    ? processos.some((p) => p.id !== processoId && resolveProcessoKitCodigo(p).toLowerCase() === kitCodigo.toLowerCase())
    : false;
  if (duplicateKit) {
    return 'Já existe um processo com este código de kit.';
  }

  if (formData.fatura_emitida && !formData.fatura_data_emissao) {
    return 'Preencha a data de emissão da fatura.';
  }

  const faturacaoErr = validateFaturacaoData(
    {
      fatura_numero: formData.fatura_numero,
      fatura_data_emissao: formData.fatura_data_emissao,
      fatura_emitida: formData.fatura_emitida,
      valor_final: formData.valor_final,
      pago: formData.pago,
      pagamento_data: formData.pagamento_data,
      recibo_numero: formData.recibo_numero,
    } as ProcessFaturacaoData,
    workflowDatesFromProcesso(formData),
  );
  if (faturacaoErr) return faturacaoErr;

  if (formData.pagamento_data && !formData.recibo_numero.trim()) {
    return 'Preencha o número de recibo ao marcar a fatura como paga.';
  }

  return null;
};

export const buildProcessSubmitPayload = (formData: ProcessFormData): Partial<Processo> => {
  const {
    posto: _posto,
    data_colheita: _dataColheita,
    data_colheita_prevista: _dataColheitaPrevista,
    ...editable
  } = formData;

  return {
    ...editable,
    valor_final: computeValorFinal(formData.valor_base ?? 0, formData.desconto_percentual ?? 0),
    fatura_emitida: !!(formData.fatura_numero?.trim() || formData.fatura_data_emissao),
  };
};
