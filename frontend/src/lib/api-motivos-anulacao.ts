import { apiRequest } from './api';
import { getAuthToken } from './api-processos';
import type { MotivoAnulacao } from '../app/data/types';

type ApiListResponse<T> = {
  data?: T[];
};

type ApiMotivoRow = {
  id: string;
  nome?: string | null;
  ativo?: boolean | null;
  contexto?: string | null;
  reabre_contacto?: boolean | null;
};

const mapMotivo = (item: ApiMotivoRow): MotivoAnulacao => ({
  id: item.id,
  nome: item.nome || '',
  ativo: item.ativo !== false,
  contexto: item.contexto === 'processo' ? 'processo' : 'contacto',
  reabre_contacto: !!item.reabre_contacto,
});

export const motivosAnulacaoApi = {
  async list(): Promise<MotivoAnulacao[]> {
    const token = getAuthToken();
    if (!token) return [];
    const response = await apiRequest<ApiListResponse<ApiMotivoRow>>(
      '/motivos-anulacao',
      { token },
    );
    return (response.data || []).map(mapMotivo);
  },

  async create(data: Pick<MotivoAnulacao, 'nome' | 'contexto' | 'reabre_contacto'>): Promise<MotivoAnulacao> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    const response = await apiRequest<{ data: ApiMotivoRow }>(
      '/motivos-anulacao',
      {
        method: 'POST',
        token,
        body: {
          nome: data.nome.trim(),
          contexto: data.contexto || 'contacto',
          reabre_contacto: data.contexto === 'processo' ? !!data.reabre_contacto : false,
        },
      },
    );
    return mapMotivo(response.data);
  },

  async update(id: string, data: Partial<Pick<MotivoAnulacao, 'nome' | 'contexto' | 'reabre_contacto' | 'ativo'>>): Promise<MotivoAnulacao> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    const response = await apiRequest<{ data: ApiMotivoRow }>(
      `/motivos-anulacao/${id}`,
      { method: 'PUT', token, body: data },
    );
    return mapMotivo(response.data);
  },

  async remove(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão inválida.');
    await apiRequest(`/motivos-anulacao/${id}`, { method: 'DELETE', token });
  },
};
