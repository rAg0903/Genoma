import { apiRequest, API_BASE_URL } from './api';

const AUTH_TOKEN_KEYS = ['token', 'authToken', 'jwtToken', 'access_token'];
export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  for (const key of AUTH_TOKEN_KEYS) {
    const v = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (v) return v;
  }
  return undefined;
};

export interface AnomaliaGenetica {
  id?: string;
  cromossoma: string;
  resultado_valor?: string;
  probabilidade?: string | null;
  tipo_resultado?: 'Cromossoma' | 'Sexual';
}

export interface ResultadoProcesso {
  processo_id: string;
  numero_processo: string;
  status: string;
  resultado_tudo_ok: boolean;
  resultado_anomalias: string;
  data_resultado: string | null;
  data_validacao: string | null;
  relatorio_validado: boolean;
  anomalias: AnomaliaGenetica[];
}

export interface FaturacaoProcesso {
  processo_id: string;
  numero_processo: string;
  fatura_emitida: boolean;
  fatura_numero: string;
  fatura_data_emissao: string | null;
  valor_base: number;
  desconto_percentual: number;
  valor_final: number;
  pagamento_data: string | null;
  recibo_numero: string;
  pago: boolean;
  registos: unknown[];
}

export interface RelatorioRegisto {
  id: string;
  processo_id?: string;
  template?: string;
  pdf_url?: string;
  estado_envio?: string;
  created_at?: string;
}

const wrap = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const processosApi = {
  getResultados: (id: string) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/resultados`, { token: getAuthToken() })),

  registarResultados: (id: string, body: { tudo_ok: boolean; anomalias?: AnomaliaGenetica[]; data_resultado?: string }) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/resultados`, { method: 'POST', token: getAuthToken(), body })),

  validar: (id: string, body: { data_validacao?: string; responsavel_fluxo?: string } = {}) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/validar`, { method: 'POST', token: getAuthToken(), body })),

  listRelatorios: (id: string) =>
    wrap(apiRequest<{ data: RelatorioRegisto[] }>(`/processos/${id}/relatorios`, { token: getAuthToken() })),

  gerarRelatorio: (id: string, body: { template?: string; observacoes?: string } = {}) =>
    wrap(apiRequest<{ data: RelatorioRegisto & { html: string } }>(`/processos/${id}/relatorio`, { method: 'POST', token: getAuthToken(), body })),

  enviarRelatorio: (id: string, body: { destino: 'Medico' | 'Utente' | 'Ambos'; estado_envio?: string; relatorio_id?: string; observacoes?: string }) =>
    wrap(apiRequest<{ data: unknown }>(`/processos/${id}/relatorio/enviar`, { method: 'POST', token: getAuthToken(), body })),

  getFaturacao: (id: string) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao`, { token: getAuthToken() })),

  emitirFatura: (id: string, body: { valor_base?: number; desconto_percentual?: number; entidade_multibanco?: string; referencia_multibanco?: string; comissao?: boolean } = {}) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao`, { method: 'POST', token: getAuthToken(), body })),

  registarPagamento: (id: string, body: { recibo_numero: string; pagamento_data?: string }) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao/pagamento`, { method: 'POST', token: getAuthToken(), body })),

  /** Abre o relatorio HTML (autenticado) numa nova aba via blob URL. */
  async abrirRelatorioHtml(id: string): Promise<void> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/processos/${id}/relatorio/html`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Falha ao obter o relatorio.');
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => URL.revokeObjectURL(url), 60000);
    else URL.revokeObjectURL(url);
  },
};
