import { apiRequest, API_BASE_URL } from './api';
import type { ColheitaProcesso } from './colheita';

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
  cromossomas_analisados: number[];
  resultados_cromossomas: Record<number, string>;
  sem_anomalias: boolean;
  sugerir_repeticao: boolean;
  fracao_fetal: string;
  cromossomas_sexuais: string;
  resultado_cromossomas_sexuais: string;
  id_amostra: string;
  data_envio_laboratorio: string | null;
  data_recepcao_laboratorio: string | null;
  data_relatorio_laboratorio: string | null;
  teste_cromossomas?: string | null;
  incluir_fracao_fetal?: boolean;
  determinacao_sexo_fetal?: boolean;
  relatorio_arquivo?: {
    skipped?: boolean;
    anexo?: { id: string; titulo: string };
    motivo?: string;
  } | null;
}

export interface RegistarResultadosBody {
  sem_anomalias?: boolean;
  sugerir_repeticao?: boolean;
  resultados_cromossomas?: Record<number, string>;
  /** Legado — ainda aceite pelo backend */
  tudo_ok?: boolean;
  anomalias?: AnomaliaGenetica[];
  fracao_fetal?: string;
  cromossomas_sexuais?: string;
  resultado_cromossomas_sexuais?: string;
  id_amostra?: string;
  data_resultado?: string;
  data_envio_laboratorio?: string;
  data_recepcao_laboratorio?: string;
  data_relatorio_laboratorio?: string;
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
  html?: string;
  anexo?: { id: string; titulo: string; url?: string };
  skipped?: boolean;
  motivo?: string | null;
}

export interface AnexoProcesso {
  id: string;
  titulo: string;
  url?: string | null;
  descricao?: string | null;
  created_at?: string;
  processo_id?: string;
}

const wrap = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const processosApi = {
  getResultados: (id: string) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/resultados`, { token: getAuthToken() })),

  registarResultados: (id: string, body: RegistarResultadosBody) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/resultados`, { method: 'POST', token: getAuthToken(), body })),

  validar: (id: string, body: { data_validacao?: string; responsavel_fluxo?: string } = {}) =>
    wrap(apiRequest<{ data: ResultadoProcesso }>(`/processos/${id}/validar`, { method: 'POST', token: getAuthToken(), body })),

  listRelatorios: (id: string) =>
    wrap(apiRequest<{ data: RelatorioRegisto[] }>(`/processos/${id}/relatorios`, { token: getAuthToken() })),

  gerarRelatorio: async (id: string, body: { template?: string; observacoes?: string; pdf_base64?: string } = {}) =>
    wrap(apiRequest<{ data: RelatorioRegisto }>(`/processos/${id}/relatorio`, { method: 'POST', token: getAuthToken(), body })),

  listRelatoriosAnexos: (id: string) =>
    wrap(apiRequest<{ data: AnexoProcesso[] }>(`/anexos/processo/${id}`, { token: getAuthToken() })),

  enviarRelatorio: (id: string, body: { destino: 'Medico' | 'Utente' | 'Ambos'; estado_envio?: string; relatorio_id?: string; observacoes?: string }) =>
    wrap(apiRequest<{ data: unknown }>(`/processos/${id}/relatorio/enviar`, { method: 'POST', token: getAuthToken(), body })),

  getFaturacao: (id: string) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao`, { token: getAuthToken() })),

  emitirFatura: (id: string, body: { valor_base?: number; desconto_percentual?: number; entidade_multibanco?: string; referencia_multibanco?: string; comissao?: boolean } = {}) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao`, { method: 'POST', token: getAuthToken(), body })),

  registarPagamento: (id: string, body: { recibo_numero: string; pagamento_data?: string }) =>
    wrap(apiRequest<{ data: FaturacaoProcesso }>(`/processos/${id}/faturacao/pagamento`, { method: 'POST', token: getAuthToken(), body })),

  getColheita: (id: string) =>
    wrap(apiRequest<{ data: ColheitaProcesso }>(`/processos/${id}/colheita`, { token: getAuthToken() })),

  updateColheita: (id: string, body: Partial<ColheitaProcesso>) =>
    wrap(apiRequest<{ data: ColheitaProcesso }>(`/processos/${id}/colheita`, { method: 'PUT', token: getAuthToken(), body })),

  /** Obtém o HTML do relatório (pedido autenticado). */
  async fetchRelatorioHtml(id: string): Promise<string> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/processos/${id}/relatorio/html`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      let message = 'Falha ao obter o relatório.';
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error || parsed?.message || message;
      } catch {
        if (text.trim()) message = text.trim();
      }
      throw new Error(message);
    }
    return res.text();
  },
};
