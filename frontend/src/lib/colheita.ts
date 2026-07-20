export type ColheitaPeriodo = 'Manhã' | 'Tarde' | 'Noite' | '';

export type ColheitaFormState = {
  posto_id: string;
  data_prevista: string;
  data_efetiva: string;
  periodo: ColheitaPeriodo;
  facturado_entidade: boolean;
  repeticao: boolean;
  nao_notificar: boolean;
  semanas_gestacao: string;
  dias_gestacao: string;
  data_recepcao_amostra: string;
};

export const emptyColheitaForm = (): ColheitaFormState => ({
  posto_id: '',
  data_prevista: '',
  data_efetiva: '',
  periodo: '',
  facturado_entidade: false,
  repeticao: false,
  nao_notificar: false,
  semanas_gestacao: '',
  dias_gestacao: '',
  data_recepcao_amostra: '',
});

export const PERIODO_COLHEITA_OPTIONS: { value: ColheitaPeriodo; label: string }[] = [
  { value: 'Manhã', label: 'Manhã' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noite', label: 'Noite' },
];

export type ColheitaProcesso = {
  id?: string;
  processo_id: string;
  posto_id?: string | null;
  posto_nome?: string;
  data_prevista?: string | null;
  periodo?: ColheitaPeriodo | null;
  data_efetiva?: string | null;
  facturado_entidade?: boolean;
  repeticao?: boolean;
  nao_notificar?: boolean;
  semanas_gestacao_colheita?: number | null;
  dias_gestacao_colheita?: number | null;
  data_recepcao_amostra?: string | null;
};

export const colheitaFromContact = (c: {
  posto_colheita_id?: string;
  data_colheita_prevista?: string;
  colheita_periodo?: string | null;
  colheita_facturado_entidade?: boolean;
  colheita_repeticao?: boolean;
  colheita_nao_notificar?: boolean;
  colheita_semanas_gestacao?: number | null;
  colheita_dias_gestacao?: number | null;
  colheita_data_recepcao_amostra?: string | null;
  colheita_data_efetiva?: string | null;
}): ColheitaFormState => ({
  posto_id: c.posto_colheita_id || '',
  data_prevista: c.data_colheita_prevista || '',
  data_efetiva: c.colheita_data_efetiva || '',
  periodo: (c.colheita_periodo as ColheitaPeriodo) || '',
  facturado_entidade: !!c.colheita_facturado_entidade,
  repeticao: !!c.colheita_repeticao,
  nao_notificar: !!c.colheita_nao_notificar,
  semanas_gestacao: c.colheita_semanas_gestacao != null ? String(c.colheita_semanas_gestacao) : '',
  dias_gestacao: c.colheita_dias_gestacao != null ? String(c.colheita_dias_gestacao) : '',
  data_recepcao_amostra: c.colheita_data_recepcao_amostra || '',
});

export const colheitaContactPayload = (colheita: ColheitaFormState) => ({
  colheita_periodo: colheita.periodo || null,
  colheita_facturado_entidade: colheita.facturado_entidade,
  colheita_repeticao: colheita.repeticao,
  colheita_nao_notificar: colheita.nao_notificar,
  colheita_semanas_gestacao: colheita.semanas_gestacao !== '' ? Number(colheita.semanas_gestacao) : null,
  colheita_dias_gestacao: colheita.dias_gestacao !== '' ? Number(colheita.dias_gestacao) : null,
  colheita_data_recepcao_amostra: colheita.data_recepcao_amostra || null,
  colheita_data_efetiva: colheita.data_efetiva || null,
});

export const colheitaToProcessoPayload = (colheita: ColheitaFormState) => ({
  periodo: colheita.periodo || null,
  facturado_entidade: colheita.facturado_entidade,
  repeticao: colheita.repeticao,
  nao_notificar: colheita.nao_notificar,
  semanas_gestacao_colheita: colheita.semanas_gestacao !== '' ? Number(colheita.semanas_gestacao) : null,
  dias_gestacao_colheita: colheita.dias_gestacao !== '' ? Number(colheita.dias_gestacao) : null,
  data_recepcao_amostra: colheita.data_recepcao_amostra || null,
});

export const colheitaProcessoToForm = (row: ColheitaProcesso): ColheitaFormState => ({
  posto_id: row.posto_id || '',
  data_prevista: row.data_prevista || '',
  data_efetiva: row.data_efetiva || '',
  periodo: (row.periodo as ColheitaPeriodo) || '',
  facturado_entidade: !!row.facturado_entidade,
  repeticao: !!row.repeticao,
  nao_notificar: !!row.nao_notificar,
  semanas_gestacao: row.semanas_gestacao_colheita != null ? String(row.semanas_gestacao_colheita) : '',
  dias_gestacao: row.dias_gestacao_colheita != null ? String(row.dias_gestacao_colheita) : '',
  data_recepcao_amostra: row.data_recepcao_amostra || '',
});
