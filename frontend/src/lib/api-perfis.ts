import { apiRequest } from './api';
import { StockSubmodule } from './permissions';

export type Perfil = {
  id: string;
  nome: string;
  ativo?: boolean;
  created_at?: string;
};

const getToken = () =>
  window.localStorage.getItem('token')
  || window.localStorage.getItem('authToken')
  || window.sessionStorage.getItem('token')
  || undefined;

export const perfisApi = {
  list: () => apiRequest<{ data: Perfil[]; count: number }>('/perfis', { token: getToken() }),

  create: (nome: string) =>
    apiRequest<{ message: string; data: Perfil }>('/perfis', {
      method: 'POST',
      token: getToken(),
      body: { nome: nome.trim() },
    }),

  update: (id: string, nome: string) =>
    apiRequest<{ message: string; data: Perfil }>(`/perfis/${encodeURIComponent(id)}`, {
      method: 'PUT',
      token: getToken(),
      body: { nome: nome.trim() },
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/perfis/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  getStockSubmodulos: (perfilId: string) =>
    apiRequest<{ data: { perfil_id?: string; permissoes?: Partial<Record<StockSubmodule, boolean>> } }>(
      `/perfis/${encodeURIComponent(perfilId)}/stocks-submodulos`,
      { token: getToken() },
    ),

  updateStockSubmodulos: (perfilId: string, permissoes: Partial<Record<StockSubmodule, boolean>>) =>
    apiRequest(`/perfis/${encodeURIComponent(perfilId)}/stocks-submodulos`, {
      method: 'PUT',
      token: getToken(),
      body: permissoes,
    }),
};
