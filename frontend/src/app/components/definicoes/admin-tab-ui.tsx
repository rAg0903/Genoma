import { ReactNode } from 'react';
import { PANEL } from '../../../lib/design-tokens';
import { ToolbarSearchRow } from '../shared/PageToolbar';

export const ADMIN_TABLE_PANEL_CLASS = PANEL.table;

export const ADMIN_TABLE_HEAD_CLASS = PANEL.tableHead;

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

/** Barra de pesquisa alargada + botão de ação. */
export function AdminTabToolbar({
  search,
  onSearchChange,
  placeholder,
  searchName,
  action,
}: AdminTabToolbarProps) {
  return (
    <ToolbarSearchRow
      search={search}
      onSearchChange={onSearchChange}
      placeholder={placeholder}
      searchName={searchName}
      actions={action}
    />
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
