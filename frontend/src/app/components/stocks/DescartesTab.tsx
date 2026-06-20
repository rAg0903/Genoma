import { useMemo, useState } from 'react';
import { Trash2, Search, ArrowRight, X } from 'lucide-react';
import { RequisicaoKit } from '../../data/types';
import { EmptyState } from '../shared/EmptyState';
import { StatusBadge } from '../shared/StatusBadge';
import { MinDatePicker } from '../shared/MinDatePicker';
import { formatRequisicaoLocationLabel, isRequisicaoDescarte } from '../../../lib/stock-locations';
import { formatCalendarDatePt, normalizeCalendarDate } from '../../../lib/dates';
import { useLanguage } from '../../../i18n/LanguageContext';

const REQUISICAO_STATUS_STYLES: Record<string, string> = {
  Entregue: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Cancelada: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

interface DescartesTabProps {
  requisicoes: RequisicaoKit[];
  finalLabIds?: string[];
  featureHealthLabId?: string;
}

export function DescartesTab({ requisicoes, finalLabIds, featureHealthLabId }: DescartesTabProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const labFilter = finalLabIds?.length
    ? finalLabIds
    : (featureHealthLabId ? [featureHealthLabId] : undefined);

  const descartes = useMemo(
    () => requisicoes.filter((r) => isRequisicaoDescarte(r, labFilter)),
    [requisicoes, labFilter],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const dateIso = normalizeCalendarDate(dateFilter);
    return descartes.filter((r) => {
      if (dateIso && normalizeCalendarDate(r.data) !== dateIso) return false;
      if (!q) return true;
      return [
        r.numero_envio,
        r.utilizador_nome,
        r.origem,
        r.destino,
        r.origem_nome,
        r.destino_nome,
        r.tracking_number,
      ].some((f) => (f || '').toLowerCase().includes(q));
    });
  }, [descartes, search, dateFilter]);

  const dateInputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('stocks.searchDescartes')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <div className="flex w-full shrink-0 items-center gap-1 sm:w-52">
          <MinDatePicker
            allowAnyDate
            value={dateFilter}
            onChange={setDateFilter}
            placeholder={t('stocks.filterByDate')}
            className={dateInputClass}
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title={t('stocks.clearDateFilter')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Trash2} title={t('stocks.emptyDescartes.title')} description={t('stocks.emptyDescartes.description')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('stocks.table.shipmentNo')}</th>
                  <th className="px-4 py-3">{t('stocks.table.date')}</th>
                  <th className="px-4 py-3">{t('stocks.table.route')}</th>
                  <th className="px-4 py-3">{t('stocks.table.user')}</th>
                  <th className="px-4 py-3">{t('stocks.table.quantity')}</th>
                  <th className="px-4 py-3">{t('stocks.table.tracking')}</th>
                  <th className="px-4 py-3">{t('stocks.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300">{r.numero_envio || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{formatCalendarDatePt(r.data)}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        {formatRequisicaoLocationLabel(r.origem, r.origem_nome)}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        {formatRequisicaoLocationLabel(r.destino, r.destino_nome)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{r.utilizador_nome || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{r.quantidade}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.tracking_number || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} map={REQUISICAO_STATUS_STYLES} className="px-2 py-0.5" /></td>
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
