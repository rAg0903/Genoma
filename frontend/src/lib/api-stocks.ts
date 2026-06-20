import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export interface AuditoriaEvento {
  id: string;
  data: string;
  utilizador: string;
  acao: string;
  tabela: string;
  registro_id: string | null;
}

const t = () => getAuthToken();

export const stocksApi = {
  auditoria: () =>
    apiRequest<{ data: AuditoriaEvento[] }>(`/stocks/auditoria`, { token: t() }).then((r) => r.data || []),

  // Kit CRUD (backend adicionado na Fase 8)
  createKit: (body: Record<string, unknown>) =>
    apiRequest<{ data: unknown }>(`/stocks/kits`, { method: 'POST', token: t(), body }),
  updateKit: (id: string, body: Record<string, unknown>) =>
    apiRequest<{ data: unknown }>(`/stocks/kits/${id}`, { method: 'PUT', token: t(), body }),
  deleteKit: (id: string) =>
    apiRequest<{ message: string }>(`/stocks/kits/${id}`, { method: 'DELETE', token: t() }),

  updateLote: (id: string, body: Record<string, unknown>) =>
    apiRequest<{ data: unknown }>(`/stocks/lotes/${id}`, { method: 'PUT', token: t(), body }),
};
