import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';
import { DRAWER } from '../../../lib/design-tokens';

export function DrawerTabBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function DrawerPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${DRAWER.panel} ${className}`}>{children}</div>;
}

export function DrawerPanelHeader({
  title,
  icon: Icon,
  action,
  subtitle,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 dark:border-[#3d4f6a]/40">
      <div className="min-w-0">
        <div className={DRAWER.sectionTitle}>
          {Icon && (
            <span className={DRAWER.sectionIcon}>
              <Icon className={DRAWER.sectionIconGlyph} />
            </span>
          )}
          <span>{title}</span>
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function DrawerPanelContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${DRAWER.panelBody} ${className}`}>{children}</div>;
}

export function DrawerStatusBanner({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${DRAWER.statusBanner} flex items-center justify-between gap-4`}>
      <div className="min-w-0 border-l-[3px] border-teal-500 pl-3">
        <div className={DRAWER.fieldLabel}>{label}</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {hint && <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hint}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function DrawerActionCard({
  title,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={DRAWER.actionCard}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/15 transition group-hover:bg-teal-500/15 dark:bg-teal-400/12 dark:ring-teal-400/25">
          <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-teal-500 dark:text-slate-600" />
    </button>
  );
}

export function DrawerFieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  const gridClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${gridClass} gap-x-6 gap-y-4`}>{children}</div>;
}

export function DrawerField({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className={DRAWER.fieldLabel}>{label}</div>
      <div
        className={DRAWER.fieldValue}
        style={{ fontFamily: mono ? 'ui-monospace, monospace' : undefined }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

export function DrawerEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 dark:border-[#3d4f6a]/50 dark:bg-[#1f2a3d]/40 dark:text-slate-400">
      {message}
    </div>
  );
}

export function DrawerLoading({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white py-12 text-sm text-slate-500 dark:border-[#3d4f6a]/50 dark:bg-[#1f2a3d] dark:text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
      {label}
    </div>
  );
}
