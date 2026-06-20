import { useCallback, useEffect, useState } from 'react';
import { Boxes, Package, FolderOpen, FlaskConical, ChevronRight, Loader2, Link2 } from 'lucide-react';
import { apiRequest } from '../../../lib/api';
import { getAuthToken } from '../../../lib/api-processos';
import { EmptyState } from './EmptyState';

export type TraceTipo = 'lote' | 'kit' | 'processo' | 'resultado';

interface TraceNode {
  tipo: TraceTipo;
  id: string;
  label: string;
  sublabel?: string;
}

interface TraceResponse {
  cadeia: TraceNode[];
  eventos?: { data?: string; descricao: string }[];
}

const TIPO_ICON = { lote: Boxes, kit: Package, processo: FolderOpen, resultado: FlaskConical };

/**
 * Vista de rastreabilidade bidirecional Lote <-> Kit <-> Processo <-> Resultado.
 * Consome GET /trace?tipo=&id= (ver backend). Degrada com elegancia se o
 * endpoint ainda nao estiver disponivel.
 */
export function TraceView({ tipo, id }: { tipo: TraceTipo; id: string }) {
  const [focus, setFocus] = useState<{ tipo: TraceTipo; id: string }>({ tipo, id });
  const [data, setData] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { setFocus({ tipo, id }); }, [tipo, id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiRequest<{ data: TraceResponse }>(`/trace?tipo=${focus.tipo}&id=${encodeURIComponent(focus.id)}`, { token: getAuthToken() });
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [focus]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> A tracar cadeia…</div>;
  }

  if (error || !data || data.cadeia.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="Rastreabilidade indisponivel"
        description="A cadeia de rastreio sera apresentada assim que o servico de rastreabilidade estiver ativo."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {data.cadeia.map((node, i) => {
          const Icon = TIPO_ICON[node.tipo];
          const isCurrent = node.tipo === focus.tipo && node.id === focus.id;
          return (
            <span key={`${node.tipo}-${node.id}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
              <button
                onClick={() => setFocus({ tipo: node.tipo, id: node.id })}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition ${
                  isCurrent
                    ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-mono">{node.label}</span>
              </button>
            </span>
          );
        })}
      </div>

      {data.eventos && data.eventos.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {data.eventos.map((ev, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-slate-700 dark:text-slate-300">{ev.descricao}</span>
              {ev.data && <span className="text-xs text-slate-400 tabular-nums">{new Date(ev.data).toLocaleDateString('pt-PT')}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
