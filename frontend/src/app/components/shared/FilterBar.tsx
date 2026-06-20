import { ReactNode, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  tone?: 'brand' | 'danger' | 'warning' | 'info' | 'neutral';
}

const CHIP_TONES: Record<NonNullable<FilterChip['tone']>, string> = {
  brand: 'data-[active=true]:bg-teal-600 data-[active=true]:text-white data-[active=true]:border-teal-600',
  danger: 'data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600',
  warning: 'data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500',
  info: 'data-[active=true]:bg-sky-600 data-[active=true]:text-white data-[active=true]:border-sky-600',
  neutral: 'data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700',
};

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  activeChipId?: string;
  onChipClick?: (id: string) => void;
  /** Conteudo dos filtros avancados (renderizado num popover) */
  advanced?: ReactNode;
  /** Numero de filtros avancados ativos (badge) */
  advancedCount?: number;
  onClearAdvanced?: () => void;
  right?: ReactNode;
}

/**
 * Toolbar de filtros reutilizavel: pesquisa + chips de filtro rapido +
 * popover de filtros avancados + slot a direita (ex.: alternar vista).
 */
export function FilterBar({
  searchValue, onSearchChange, searchPlaceholder = 'Pesquisar...',
  chips, activeChipId, onChipClick, advanced, advancedCount = 0, onClearAdvanced, right,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          {advanced && (
            <div className="relative">
              <button
                onClick={() => setShowAdvanced((s) => !s)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {advancedCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                    {advancedCount}
                  </span>
                )}
              </button>
              {showAdvanced && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowAdvanced(false)} />
                  <div className="absolute right-0 mt-2 w-80 z-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filtros avancados</span>
                      {onClearAdvanced && advancedCount > 0 && (
                        <button onClick={onClearAdvanced} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Limpar</button>
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
      </div>

      {chips && chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <button
              key={chip.id}
              data-active={activeChipId === chip.id}
              onClick={() => onChipClick?.(chip.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition ${CHIP_TONES[chip.tone ?? 'brand']}`}
            >
              {chip.label}
              {typeof chip.count === 'number' && (
                <span className="opacity-70 tabular-nums">{chip.count}</span>
              )}
              {activeChipId === chip.id && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
