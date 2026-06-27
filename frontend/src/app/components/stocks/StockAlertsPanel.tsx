import { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Building2, MapPin, Layers } from 'lucide-react';
import { ALERT_STYLES, AlertLevel, SURFACE } from '../../../lib/design-tokens';
import { DashboardAlert } from '../dashboard/AlertPanel';

type AlertCategory = 'all' | 'posto' | 'empresa' | 'outros';

const NIVEL_LABEL: Record<AlertLevel, string> = {
  critico: 'Critico',
  aviso: 'Aviso',
  info: 'Info',
  sucesso: 'OK',
};

const NIVEL_ORDER: AlertLevel[] = ['critico', 'aviso', 'info', 'sucesso'];

const categorizeAlert = (titulo: string): Exclude<AlertCategory, 'all'> => {
  if (titulo.includes('Posto:')) return 'posto';
  if (titulo.includes('Empresa:')) return 'empresa';
  return 'outros';
};

const formatLocalLabel = (titulo: string): string =>
  titulo.replace(/^Stock baixo — /, '').trim();

const FILTER_META: { id: AlertCategory; label: string; icon: typeof MapPin }[] = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'empresa', label: 'Empresas', icon: Building2 },
  { id: 'posto', label: 'Postos', icon: MapPin },
  { id: 'outros', label: 'Outros', icon: AlertTriangle },
];

/**
 * Painel de alertas de inventario — layout compacto em tabela com scroll,
 * pensado para escalar com dezenas de postos em stock baixo.
 */
export function StockAlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const [filter, setFilter] = useState<AlertCategory>('all');

  const counts = useMemo(() => {
    const byCategory = { posto: 0, empresa: 0, outros: 0 };
    let criticos = 0;
    let avisos = 0;
    for (const a of alerts) {
      byCategory[categorizeAlert(a.titulo)] += 1;
      if (a.nivel === 'critico') criticos += 1;
      if (a.nivel === 'aviso') avisos += 1;
    }
    return { ...byCategory, all: alerts.length, criticos, avisos };
  }, [alerts]);

  const filtered = useMemo(() => {
    const list = filter === 'all'
      ? alerts
      : alerts.filter((a) => categorizeAlert(a.titulo) === filter);
    return [...list].sort(
      (a, b) => NIVEL_ORDER.indexOf(a.nivel) - NIVEL_ORDER.indexOf(b.nivel)
        || a.titulo.localeCompare(b.titulo, 'pt'),
    );
  }, [alerts, filter]);

  return (
    <section className={`${SURFACE.cardElevated} overflow-hidden flex flex-col`}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Alertas criticos</h3>
          {alerts.length > 0 && (
            <span className="text-[11px] text-slate-400 tabular-nums">({alerts.length})</span>
          )}
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {counts.criticos > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                {counts.criticos} criticos
              </span>
            )}
            {counts.avisos > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {counts.avisos} avisos
              </span>
            )}
          </div>
        )}
      </header>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          {FILTER_META.map(({ id, label, icon: Icon }) => {
            const count = counts[id];
            if (id !== 'all' && count === 0) return null;
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <span className={`tabular-nums ${active ? 'text-teal-100' : 'text-slate-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="px-3.5 py-8 text-center">
          {alerts.length === 0 ? (
            <>
              <div className="w-8 h-8 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1.5">
                <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sem alertas. Tudo operacional.</p>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum alerta nesta categoria.</p>
          )}
        </div>
      ) : (
        <div className="overflow-auto max-h-[min(280px,38vh)]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900 shadow-[0_1px_0_0_rgba(148,163,184,0.25)]">
              <tr className="text-[10px] uppercase tracking-wide text-slate-400">
                <th className="px-3.5 py-2 font-semibold">Local / alerta</th>
                <th className="px-3 py-2 font-semibold text-right w-20">Kits</th>
                <th className="px-3.5 py-2 font-semibold w-24">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => {
                const s = ALERT_STYLES[a.nivel];
                const isLowStock = a.titulo.startsWith('Stock baixo');
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-2 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate" title={a.titulo}>
                        {isLowStock ? formatLocalLabel(a.titulo) : a.titulo}
                      </p>
                      {a.descricao && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={a.descricao}>
                          {a.descricao}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {typeof a.total === 'number' ? (
                        <span className={`text-sm font-bold tabular-nums ${s.label}`}>{a.total}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${s.label}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {NIVEL_LABEL[a.nivel]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 8 && (
        <p className="px-3.5 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          {filtered.length} alertas — use o scroll ou filtros para navegar
        </p>
      )}
    </section>
  );
}
