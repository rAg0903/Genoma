import { ReactNode, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { DRAWER, MODAL } from '../../../lib/design-tokens';
import { SlidingTabItem, SlidingTabs } from './SlidingTabs';

export interface DrawerTab<T extends string> {
  id: T;
  label: string;
  badge?: number | string;
  icon?: LucideIcon;
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
  width?: 'md' | 'lg' | 'xl' | '2xl' | 'compact';
  /** Tabs sem animação suave (drawers) */
  instantTabs?: boolean;
  children: ReactNode;
}

const WIDTHS = {
  md: 'max-w-md',
  compact: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

/**
 * Drawer lateral (slide-over) com cabecalho, abas deslizantes, corpo com scroll
 * e rodape fixo. Mantem o contexto da lista por baixo.
 */
export function DetailDrawer<T extends string>({
  open, onClose, title, subtitle, headerExtra, tabs, activeTab, onTabChange, footer, width = 'lg', instantTabs = false, children,
}: DetailDrawerProps<T>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const slidingTabs: SlidingTabItem<T>[] | undefined = tabs?.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    count: typeof t.badge === 'number' ? t.badge : undefined,
  }));

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] animate-in fade-in" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full ${WIDTHS[width]} ${DRAWER.shell}`}>
        <div className={`flex items-start justify-between gap-3 ${DRAWER.header}`}>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</div>
            {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1.5">
            {headerExtra}
            <button type="button" onClick={onClose} className={MODAL.closeBtn} aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {slidingTabs && slidingTabs.length > 0 && activeTab !== undefined && onTabChange && (
          <div className={DRAWER.tabs}>
            <SlidingTabs
              items={slidingTabs}
              active={activeTab}
              onChange={onTabChange}
              size="sm"
              instant={instantTabs}
              ariaLabel="Secções do detalhe"
            />
          </div>
        )}

        <div className={DRAWER.body}>{children}</div>

        {footer && <div className={DRAWER.footer}>{footer}</div>}
      </div>
    </div>
  );
}
