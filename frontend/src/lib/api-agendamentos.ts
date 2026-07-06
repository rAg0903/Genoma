import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export interface CalendarDay {
  dia: string;
  total: number;
  cor: 'cinza' | 'verde' | 'amarelo' | 'vermelho';
}

export interface Agendamento {
  id: string;
  processo_id: string;
  numero_processo: string;
  processo_status: string;
  paciente_nome: string;
  paciente_id?: string | null;
  posto_id: string | null;
  posto_nome: string;
  kit_codigo: string;
  data_prevista: string;
  periodo: string;
  data_efetiva: string;
}

export interface NovoAgendamento {
  paciente_id: string;
  medico_id: string;
  teste_id: string;
  empresa_id?: string;
  posto_id: string;
  data_prevista: string;
  periodo?: 'Manhã' | 'Tarde' | 'Noite';
  observacoes?: string;
}

const t = () => getAuthToken();

export const agendamentosApi = {
  getCalendario: (from: string, to: string) =>
    apiRequest<{ data: CalendarDay[] }>(`/agendamentos/calendario?from=${from}&to=${to}`, { token: t() }).then((r) => r.data),

  list: (params: { from?: string; to?: string; posto_id?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.posto_id) qs.set('posto_id', params.posto_id);
    return apiRequest<{ data: Agendamento[] }>(`/agendamentos?${qs.toString()}`, { token: t() }).then((r) => r.data);
  },

  create: (body: NovoAgendamento) =>
    apiRequest<{ data: Agendamento }>(`/agendamentos`, { method: 'POST', token: t(), body }).then((r) => r.data),

  registar: (id: string, body: { data_efetiva?: string } = {}) =>
    apiRequest<{ data: Agendamento }>(`/agendamentos/${id}/registar`, { method: 'POST', token: t(), body }).then((r) => r.data),

  cancel: (id: string) =>
    apiRequest<{ message: string }>(`/agendamentos/${id}`, { method: 'DELETE', token: t() }),

  // Dados de referencia para o formulario
  medicos: () => apiRequest<{ data: { utilizador_id: string; nome: string }[] }>(`/medicos`, { token: t() }).then((r) => r.data || []),
  testes: () => apiRequest<{ data: { id: string; nome: string; sub_testes?: { id: string; nome: string }[] }[] }>(`/testes`, { token: t() }).then((r) => {
    const flat: { id: string; nome: string }[] = [];
    for (const t of r.data || []) {
      if (t.sub_testes?.length) {
        for (const st of t.sub_testes) {
          flat.push({ id: st.id, nome: `${t.nome} — ${st.nome}` });
        }
      } else {
        flat.push({ id: t.id, nome: t.nome });
      }
    }
    return flat.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  }),
  empresas: () => apiRequest<{ data: { id: string; nome?: string; tipo_empresa?: string | null }[] }>(`/empresas`, { token: t() }).then((r) => r.data || []),
};
