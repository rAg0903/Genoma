import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export type NotificacaoTipo = 'lembrete' | 'processo' | 'stock' | 'atividade';
export type NotificacaoNivel = 'critico' | 'aviso' | 'info';

export interface Notificacao {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  nivel: NotificacaoNivel;
  link: string | null;
  created_at: string;
  lida: boolean;
}

const t = () => getAuthToken();

export const notificacoesApi = {
  list: (opts?: { limit?: number; apenasNaoLidas?: boolean }) => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.apenasNaoLidas) params.set('apenas_nao_lidas', '1');
    const qs = params.toString() ? `?${params}` : '';
    return apiRequest<{ data: Notificacao[]; count: number; unreadCount: number }>(
      `/notificacoes${qs}`,
      { token: t() },
    );
  },

  markRead: (id: string) =>
    apiRequest<{ message: string }>(`/notificacoes/${encodeURIComponent(id)}/lida`, {
      method: 'POST',
      token: t(),
    }),

  markAllRead: () =>
    apiRequest<{ message: string; marked: number }>('/notificacoes/marcar-todas-lidas', {
      method: 'POST',
      token: t(),
    }),
};

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Há ${diffD}d`;
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}
