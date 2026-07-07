import { ReactNode, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CONTROL } from '../../../lib/design-tokens';
import { SearchField } from './PageToolbar';
import { SlidingTabItem, SlidingTabs } from './SlidingTabs';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  tone?: 'brand' | 'danger' | 'warning' | 'info' | 'neutral';
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  activeChipId?: string;
  onChipClick?: (id: string) => void;
  advanced?: ReactNode;
  advancedCount?: number;
  onClearAdvanced?: () => void;
  right?: ReactNode;
}

/**
 * Toolbar de filtros: pesquisa alargada, filtros rápidos (tabs deslizantes) e popover avançado.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Pesquisar...',
  chips,
  activeChipId,
  onChipClick,
  advanced,
  advancedCount = 0,
  onClearAdvanced,
  right,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filterTabs: SlidingTabItem<string>[] | undefined = chips?.map((c) => ({
    id: c.id,
    label: c.label,
    count: c.count,
  }));

  const actions = (
    <div className="flex items-center gap-2 shrink-0">
      {advanced && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className={CONTROL.buttonSecondary}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {advancedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-[#0f172b] dark:text-slate-200">
                {advancedCount}
              </span>
            )}
          </button>
          {showAdvanced && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAdvanced(false)} />
              <div className="absolute right-0 mt-2 w-[min(22rem,92vw)] max-h-[min(28rem,70vh)] overflow-y-auto z-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filtros avançados</span>
                  {onClearAdvanced && advancedCount > 0 && (
                    <button type="button" onClick={onClearAdvanced} className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 font-medium">Limpar</button>
                  )}
                </div>
                {advanced}
              </div>
            </>
          )}
        </div>
      )}
      {right}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
        <SearchField
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {actions}
      </div>

      {filterTabs && filterTabs.length > 0 && onChipClick && (
        <SlidingTabs
          items={filterTabs}
          active={activeChipId ?? ''}
          onChange={(id) => onChipClick(activeChipId === id ? '' : id)}
          size="sm"
          ariaLabel="Filtros rápidos"
        />
      )}
    </div>
  );
}
