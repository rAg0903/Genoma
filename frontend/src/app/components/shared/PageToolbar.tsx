import { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { CONTROL } from '../../../lib/design-tokens';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
};

/** Campo de pesquisa padrão (ícone + input) — usado em todas as páginas. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Pesquisar...',
  name,
  className = '',
}: SearchFieldProps) {
  return (
    <div className={`relative min-w-0 w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={CONTROL.searchInput}
      />
    </div>
  );
}

type PageTabsRowProps = {
  children: ReactNode;
  actions?: ReactNode;
};

/** Linha de tabs deslizantes + acções à direita (Relatórios, Inventário, Admin). */
export function PageTabsRow({ children, actions }: PageTabsRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">{actions}</div> : null}
    </div>
  );
}

type ToolbarSearchRowProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchName?: string;
  actions?: ReactNode;
};

/** Pesquisa alargada + botões à direita (Admin, Inventário, etc.). */
export function ToolbarSearchRow({
  search,
  onSearchChange,
  placeholder,
  searchName,
  actions,
}: ToolbarSearchRowProps) {
  return (
    <div className="grid w-full grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={placeholder}
        name={searchName}
      />
      {actions ? <div className="flex shrink-0 justify-end sm:justify-start">{actions}</div> : null}
    </div>
  );
}
