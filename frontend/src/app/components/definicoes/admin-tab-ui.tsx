import { ReactNode } from 'react';
import { Search } from 'lucide-react';

export const ADMIN_SEARCH_INPUT_CLASS =
  'pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 w-full text-slate-900 dark:text-slate-100 placeholder-slate-400';

export const ADMIN_TABLE_PANEL_CLASS =
  'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden';

export const ADMIN_TABLE_HEAD_CLASS =
  'bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800';

export const ADMIN_TABLE_BODY_CLASS = 'divide-y divide-slate-100 dark:divide-slate-800';

export const ADMIN_TABLE_ROW_CLASS =
  'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group';

export const ADMIN_TH_CLASS =
  'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

export const ADMIN_ATIVO_STATUS_MAP = {
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Inativo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const ADMIN_ACTION_BTN_CLASS =
  'p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg';

export const ADMIN_DELETE_BTN_CLASS =
  'p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg';

type AdminTabToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchName: string;
  action?: ReactNode;
};

/** Barra de pesquisa alargada + botão de ação (estilo Médicos). */
export function AdminTabToolbar({
  search,
  onSearchChange,
  placeholder,
  searchName,
  action,
}: AdminTabToolbarProps) {
  return (
    <div className="grid w-full grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
      <div className="relative min-w-0 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          name={searchName}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className={ADMIN_SEARCH_INPUT_CLASS}
          style={{ fontSize: '13px' }}
        />
      </div>
      {action ? <div className="flex shrink-0 justify-end sm:justify-start">{action}</div> : null}
    </div>
  );
}

export function AdminTabPanel({ children }: { children: ReactNode }) {
  return <div className={ADMIN_TABLE_PANEL_CLASS}>{children}</div>;
}

export function AdminRowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

export function AdminTableHeadCell({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className={ADMIN_TH_CLASS}>{children}</span>
    </th>
  );
}
