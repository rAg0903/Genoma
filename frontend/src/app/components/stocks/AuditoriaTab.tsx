import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Search, Loader2, RefreshCw } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState';
import { stocksApi, AuditoriaEvento } from '../../../lib/api-stocks';

const TABELA_TONE: Record<string, string> = {
  kits: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  lotes: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  movimentos_kits: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  requisicoes_kits: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  colheitas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function AuditoriaTab() {
  const [eventos, setEventos] = useState<AuditoriaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setEventos(await stocksApi.auditoria());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return eventos.filter((e) => !q || [e.acao, e.utilizador, e.tabela].some((f) => (f || '').toLowerCase().includes(q)));
  }, [eventos, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por acao, utilizador ou tabela..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar trilho de auditoria…</div>
        ) : error || filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={error ? 'Auditoria indisponivel' : 'Sem eventos'} description={error ? 'Nao foi possivel obter os registos de auditoria.' : 'Nenhum evento corresponde a pesquisa.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Utilizador</th>
                  <th className="px-4 py-3">Acao</th>
                  <th className="px-4 py-3">Tabela</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{e.data ? new Date(e.data).toLocaleString('pt-PT') : '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-300">{e.utilizador || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-900 dark:text-slate-100">{e.acao}</td>
                    <td className="px-4 py-3">
                      {e.tabela && <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${TABELA_TONE[e.tabela] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{e.tabela}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
