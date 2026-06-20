import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export type LembretePrioridade = 'Baixa' | 'Normal' | 'Alta';
export type LembreteEstado = 'Pendente' | 'Concluido';

export interface Lembrete {
  id: string;
  titulo: string;
  descricao: string | null;
  estado: LembreteEstado;
  prioridade: LembretePrioridade;
  data_limite: string | null;
  paciente_id: string | null;
  processo_id: string | null;
  paciente_nome: string | null;
  processo_numero: string | null;
  criado_por: string | null;
  atribuido_a: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface NovoLembrete {
  titulo: string;
  descricao?: string;
  prioridade?: LembretePrioridade;
  data_limite?: string | null;
  paciente_id?: string | null;
  processo_id?: string | null;
}

const t = () => getAuthToken();

export const lembretesApi = {
  list: (estado?: LembreteEstado) => {
    const qs = estado ? `?estado=${estado}` : '';
    return apiRequest<{ data: Lembrete[] }>(`/lembretes${qs}`, { token: t() }).then((r) => r.data || []);
  },

  create: (body: NovoLembrete) =>
    apiRequest<{ data: Lembrete }>(`/lembretes`, { method: 'POST', token: t(), body }).then((r) => r.data),

  update: (id: string, body: Partial<NovoLembrete> & { estado?: LembreteEstado }) =>
    apiRequest<{ data: Lembrete }>(`/lembretes/${id}`, { method: 'PUT', token: t(), body }).then((r) => r.data),

  toggle: (id: string, estado: LembreteEstado) =>
    apiRequest<{ data: Lembrete }>(`/lembretes/${id}`, { method: 'PUT', token: t(), body: { estado } }).then((r) => r.data),

  remove: (id: string) =>
    apiRequest<{ message: string }>(`/lembretes/${id}`, { method: 'DELETE', token: t() }),
};
