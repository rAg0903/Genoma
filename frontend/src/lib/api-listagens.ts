import { apiRequest, API_BASE_URL } from './api';
import { getAuthToken } from './api-processos';

export type ListingKey =
  | 'painel_bordo' | 'processos' | 'resultados' | 'faturacao' | 'pacientes' | 'medicos'
  | 'kits' | 'lotes' | 'colheitas';

export interface ListingColumn {
  key: string;
  header: string;
}

export interface ListingPagination {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ListingRow = Record<string, string | number | null>;

export interface ListingResponse {
  data: ListingRow[];
  columns: ListingColumn[];
  pagination: ListingPagination;
}

export interface ListingQuery {
  q?: string;
  estado?: string;
  data_de?: string;
  data_ate?: string;
  medico?: string;
  posto?: string;
  empresa?: string;
  teste?: string;
  tipo?: string;
  localizacao?: string;
  fornecedor?: string;
  especialidade?: string;
  fase_ciclo?: string;
  pago?: string;
  validado?: string;
  page?: number;
  limit?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export interface SearchResultItem {
  id: string;
  label: string;
  sublabel: string;
  target: {
    listing: ListingKey;
    module: string;
    id: string;
    paciente_id?: string;
    processo_id?: string;
    trace?: 'kit' | 'lote' | 'processo';
  };
}

export interface SearchGroup {
  tipo: string;
  label: string;
  itens: SearchResultItem[];
}

const t = () => getAuthToken();

const buildQuery = (params: Record<string, unknown>): string => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const listagensApi = {
  list: (listing: ListingKey, query: ListingQuery = {}) =>
    apiRequest<ListingResponse>(`/listagens/${listing}${buildQuery(query as Record<string, unknown>)}`, { token: t() }),

  search: (q: string) =>
    apiRequest<{ data: { grupos: SearchGroup[] } }>(`/listagens/search${buildQuery({ q })}`, { token: t() })
      .then((r) => r.data?.grupos || []),

  /**
   * Exporta uma listagem respeitando os filtros activos. CSV/XLSX descarregam
   * ficheiro; PDF abre uma janela com o HTML pronto a imprimir.
   */
  async export(listing: ListingKey, format: 'csv' | 'xlsx' | 'pdf', query: ListingQuery = {}): Promise<void> {
    const url = `${API_BASE_URL}/listagens/export/${listing}${buildQuery({ ...query, format })}`;
    const res = await fetch(url, { cache: 'no-store', headers: { Authorization: `Bearer ${t()}` } });
    if (!res.ok) throw new Error(`Falha na exportacao (${res.status})`);

    if (format === 'pdf') {
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }

    const blob = await res.blob();
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(blob, `${listing}_${stamp}.${format}`);
  },
};
