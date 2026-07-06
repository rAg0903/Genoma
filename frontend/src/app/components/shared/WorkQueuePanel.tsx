import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { SURFACE } from '../../../lib/design-tokens';

export type WorkQueueTone = 'brand' | 'danger' | 'warning' | 'info' | 'violet' | 'success';

export type WorkQueueItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  tone: WorkQueueTone;
  icon: LucideIcon;
  onClick: () => void;
};

const toneStyles: Record<WorkQueueTone, { box: string; icon: string }> = {
  brand: { box: 'bg-teal-100 dark:bg-teal-900/40', icon: 'text-teal-600 dark:text-teal-400' },
  danger: { box: 'bg-rose-100 dark:bg-rose-900/40', icon: 'text-rose-600 dark:text-rose-400' },
  warning: { box: 'bg-amber-100 dark:bg-amber-900/40', icon: 'text-amber-600 dark:text-amber-400' },
  info: { box: 'bg-sky-100 dark:bg-sky-900/40', icon: 'text-sky-600 dark:text-sky-400' },
  violet: { box: 'bg-violet-100 dark:bg-violet-900/40', icon: 'text-violet-600 dark:text-violet-400' },
  success: { box: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-600 dark:text-emerald-400' },
};

interface WorkQueuePanelProps {
  title: string;
  subtitle?: string;
  items: WorkQueueItem[];
  emptyMessage: string;
  maxHeightClass?: string;
  className?: string;
}

export function WorkQueuePanel({
  title,
  subtitle,
  items,
  emptyMessage,
  maxHeightClass = 'max-h-[320px]',
  className = '',
}: WorkQueuePanelProps) {
  return (
    <div className={`${SURFACE.cardElevated} flex flex-col overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">{title}</h3>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className={`flex-1 divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto ${maxHeightClass}`}>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-slate-400">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            const tone = toneStyles[item.tone];
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.box}`}>
                  <Icon className={`w-4 h-4 ${tone.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                  )}
                </div>
                {item.badge && (
                  <span className="text-[11px] text-slate-500 flex-shrink-0 tabular-nums">{item.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
