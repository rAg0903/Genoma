import { useMemo, useState } from 'react';
import { Edit, Trash2, Package, Search, Route } from 'lucide-react';
import { Kit } from '../../data/types';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { DetailDrawer } from '../shared/DetailDrawer';
import { TraceView } from '../shared/TraceView';
import { KIT_STATUS_STYLES } from '../../../lib/design-system';
import { validadeEstado, VALIDADE_STYLE, formatValidadeAte } from '../../../lib/stocks';
import { LOC_LABELS } from './StockForms';

interface KitsTabProps {
  kits: Kit[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (k: Kit) => void;
  onDelete: (k: Kit) => void;
}

const STATUSES = ['Disponível', 'Utilizado', 'Expirado'];
const LOCS: Kit['localizacao'][] = ['Escritorio', 'Posto', 'Laboratorio'];

export function KitsTab({ kits, canUpdate, canDelete, onEdit, onDelete }: KitsTabProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loc, setLoc] = useState('');
  const [traceKit, setTraceKit] = useState<Kit | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return kits.filter((k) =>
      (!q || [k.codigo_barras, k.tracking, k.tipo_kit, k.lote].some((f) => (f || '').toLowerCase().includes(q)))
      && (!status || k.status === status)
      && (!loc || k.localizacao === loc));
  }, [kits, search, status, loc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por codigo, tipo ou lote..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <option value="">Todos os estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={loc} onChange={(e) => setLoc(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <option value="">Todas as localizacoes</option>
          {LOCS.map((l) => <option key={l} value={l}>{LOC_LABELS[l]}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="Sem kits" description="Ajuste os filtros ou use 'Adicionar kits' para inserir kits por leitura de código de barras." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nº Kit</th>
                  <th className="px-4 py-3">Tracking #</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Localizacao</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((k) => {
                  const ve = validadeEstado(k.data_validade);
                  return (
                    <tr key={k.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-[13px] font-mono font-semibold text-slate-900 dark:text-slate-100">{k.codigo_barras}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{k.tracking || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{k.tipo_kit}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{k.lote || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={k.status} map={KIT_STATUS_STYLES} className="px-2 py-0.5" /></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{LOC_LABELS[k.localizacao]}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${VALIDADE_STYLE[ve].cls}`}>
                          {formatValidadeAte(k.data_validade)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setTraceKit(k)} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30" title="Rastrear"><Route className="w-4 h-4" /></button>
                          {canUpdate && <button onClick={() => onEdit(k)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit className="w-4 h-4" /></button>}
                          {canDelete && <button onClick={() => onDelete(k)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailDrawer
        open={!!traceKit}
        onClose={() => setTraceKit(null)}
        width="lg"
        title={<span className="font-mono">{traceKit?.codigo_barras}</span>}
        subtitle="Rastreabilidade do kit"
      >
        {traceKit && <TraceView tipo="kit" id={traceKit.id} />}
      </DetailDrawer>
    </div>
  );
}
