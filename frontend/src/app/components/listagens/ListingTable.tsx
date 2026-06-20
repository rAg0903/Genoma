import { ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Loader2, Search, AlertTriangle } from 'lucide-react';
import { ListingColumn, ListingRow, ListingPagination } from '../../../lib/api-listagens';
import { CellFormat, ListingDef } from './listingConfig';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { formatEUR, formatNumber } from '../../../lib/design-tokens';
import { formatCalendarDatePt } from '../../../lib/dates';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ListingTableProps {
  def: ListingDef;
  columns: ListingColumn[];
  rows: ListingRow[];
  pagination: ListingPagination | null;
  loading: boolean;
  error: boolean;
  sort?: string;
  dir: 'asc' | 'desc';
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onRowClick: (row: ListingRow) => void;
}

const renderCell = (row: ListingRow, key: string, format: CellFormat, def: ListingDef) => {
  const value = row[key];
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }
  switch (format) {
    case 'eur':
      return <span className="tabular-nums font-medium text-slate-700 dark:text-slate-200">{formatEUR(Number(value))}</span>;
    case 'number':
      return <span className="tabular-nums text-slate-700 dark:text-slate-200">{formatNumber(Number(value))}</span>;
    case 'date':
      return <span className="text-slate-500 dark:text-slate-400 tabular-nums text-xs">{formatCalendarDatePt(String(value))}</span>;
    case 'datetime':
      return <span className="text-slate-500 dark:text-slate-400 tabular-nums text-xs">{new Date(String(value)).toLocaleString('pt-PT')}</span>;
    case 'mono':
      return <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{String(value)}</span>;
    case 'status':
      return <StatusBadge status={String(value)} map={def.statusMap || {}} className="px-2 py-0.5" />;
    default:
      return <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(value)}</span>;
  }
};

export function ListingTable({
  def, columns, rows, pagination, loading, error, sort, dir, onSort, onPageChange, onRowClick,
}: ListingTableProps) {
  const { t } = useLanguage();
  const fmt = (key: string): CellFormat => def.formats[key] || 'text';
  const listingLabel = t(`listings.${def.key}`);

  const columnHeader = (col: ListingColumn) => {
    const key = `listingsPage.columns.${def.key}.${col.key}`;
    const translated = t(key);
    return translated !== key ? translated : col.header;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('listingsPage.table.loading', { label: listingLabel.toLowerCase() })}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={t('listingsPage.table.errorTitle')} description={t('listingsPage.table.errorDescription')} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Search} title={t('listingsPage.table.emptyTitle')} description={t('listingsPage.table.emptyDescription')} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {columns.map((col) => {
                    const active = sort === col.key;
                    const isNum = ['eur', 'number'].includes(fmt(col.key));
                    return (
                      <th
                        key={col.key}
                        onClick={() => onSort(col.key)}
                        className={`px-4 py-3 cursor-pointer select-none group ${isNum ? 'text-right' : 'text-left'}`}
                      >
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                          {columnHeader(col)}
                          {active && (dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </span>
                      </th>
                    );
                  })}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, i) => (
                  <tr
                    key={String(row.id ?? i)}
                    onClick={() => onRowClick(row)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {columns.map((col) => {
                      const isNum = ['eur', 'number'].includes(fmt(col.key));
                      return (
                        <td key={col.key} className={`px-4 py-3 text-[13px] ${isNum ? 'text-right' : ''}`}>
                          {renderCell(row, col.key, fmt(col.key), def)}
                        </td>
                      );
                    })}
                    <td className="px-2">
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {(pagination.currentPage - 1) * pagination.pageSize + 1}
                –{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)}
                {' '}{t('listingsPage.table.of')}{' '}{formatNumber(pagination.totalRecords)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('listingsPage.table.previous')}
                </button>
                <span className="px-2 text-xs text-slate-500 tabular-nums">{pagination.currentPage}/{pagination.totalPages}</span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  {t('listingsPage.table.next')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
