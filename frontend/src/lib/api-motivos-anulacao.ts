import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export interface MotivoAnulacao {
  id: string;
  nome: string;
  ativo?: boolean;
}

type ApiListResponse<T> = {
  data?: T[];
};

const mapMotivo = (item: { id: string; nome?: string | null; ativo?: boolean | null }): MotivoAnulacao => ({
  id: item.id,
  nome: item.nome || '',
  ativo: item.ativo !== false,
});

export const motivosAnulacaoApi = {
  async list(): Promise<MotivoAnulacao[]> {
    const token = getAuthToken();
    if (!token) return [];
    const response = await apiRequest<ApiListResponse<{ id: string; nome?: string | null; ativo?: boolean | null }>>(
      '/motivos-anulacao',
      { token },
    );
    return (response.data || []).map(mapMotivo);
  },

  async create(data: { nome: string }): Promise<MotivoAnulacao> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    const response = await apiRequest<{ data: { id: string; nome?: string | null; ativo?: boolean | null } }>(
      '/motivos-anulacao',
      { method: 'POST', token, body: { nome: data.nome.trim() } },
    );
    return mapMotivo(response.data);
  },

  async update(id: string, data: { nome: string }): Promise<MotivoAnulacao> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    const response = await apiRequest<{ data: { id: string; nome?: string | null; ativo?: boolean | null } }>(
      `/motivos-anulacao/${id}`,
      { method: 'PUT', token, body: { nome: data.nome.trim() } },
    );
    return mapMotivo(response.data);
  },

  async remove(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    await apiRequest(`/motivos-anulacao/${id}`, { method: 'DELETE', token });
  },
};
