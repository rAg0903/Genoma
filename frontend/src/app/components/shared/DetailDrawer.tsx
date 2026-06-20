import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerTab<T extends string> {
  id: T;
  label: string;
  badge?: number | string;
}

interface DetailDrawerProps<T extends string> {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  headerExtra?: ReactNode;
  tabs?: DrawerTab<T>[];
  activeTab?: T;
  onTabChange?: (id: T) => void;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const WIDTHS = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' };

/**
 * Drawer lateral (slide-over) com cabecalho, abas opcionais, corpo com scroll
 * e rodape fixo. Mantem o contexto da lista por baixo.
 */
export function DetailDrawer<T extends string>({
  open, onClose, title, subtitle, headerExtra, tabs, activeTab, onTabChange, footer, width = 'lg', children,
}: DetailDrawerProps<T>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] animate-in fade-in" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full ${WIDTHS[width]} bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800`}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="text-slate-900 dark:text-slate-100 text-base font-semibold tracking-tight truncate">{title}</div>
            {subtitle && <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 px-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange?.(t.id)}
                className={`relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === t.id
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {t.label}
                  {t.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">{t.badge}</span>
                  )}
                </span>
                {activeTab === t.id && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-teal-500 rounded-full" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 bg-slate-50 dark:bg-slate-900/50">{footer}</div>}
      </div>
    </div>
  );
}
