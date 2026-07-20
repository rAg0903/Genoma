import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

/**
 * Barra flutuante de acoes em massa, aparece quando ha selecao ativa.
 */
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto w-fit">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 shadow-2xl">
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-teal-500 text-white text-xs font-bold tabular-nums">
            {count}
          </span>
          <span className="text-sm text-slate-200">selecionado{count > 1 ? 's' : ''}</span>
        </div>
        <div className="h-5 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5">{children}</div>
        <button onClick={onClear} className="ml-1 p-1.5 rounded-lg hover:bg-slate-700 transition" title="Limpar selecao">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
