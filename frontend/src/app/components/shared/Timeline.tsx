import { LucideIcon } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  date?: string | null;
  state: 'done' | 'current' | 'upcoming' | 'cancelled';
  icon?: LucideIcon;
  hint?: string;
}

const STATE_STYLES = {
  done: { dot: 'bg-teal-500 border-teal-500 text-white', line: 'bg-teal-500', label: 'text-slate-700 dark:text-slate-200' },
  current: { dot: 'bg-white dark:bg-slate-900 border-teal-500 text-teal-600 ring-4 ring-teal-500/20', line: 'bg-slate-200 dark:bg-slate-700', label: 'text-teal-700 dark:text-teal-300 font-semibold' },
  upcoming: { dot: 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600', line: 'bg-slate-200 dark:bg-slate-700', label: 'text-slate-400 dark:text-slate-500' },
  cancelled: { dot: 'bg-rose-500 border-rose-500 text-white', line: 'bg-slate-200 dark:bg-slate-700', label: 'text-rose-600 dark:text-rose-400' },
} as const;

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' }) : '';

/**
 * Linha temporal vertical de fases/eventos com estados (concluido/atual/futuro).
 */
export function Timeline({ steps, dense = false }: { steps: TimelineStep[]; dense?: boolean }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const s = STATE_STYLES[step.state];
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${s.line}`} />}
            <span className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2 flex-shrink-0 ${s.dot}`}>
              {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </span>
            <div className={`min-w-0 flex-1 ${dense ? 'pt-0.5' : 'pt-1'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm ${s.label}`}>{step.label}</span>
                {step.date && <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">{formatDate(step.date)}</span>}
              </div>
              {step.hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{step.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
