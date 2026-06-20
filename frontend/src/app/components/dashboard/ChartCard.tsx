import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { SURFACE } from '../../../lib/design-tokens';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Contentor padrao para graficos/seccoes do dashboard: cabecalho com titulo,
 * subtitulo e accao opcional, sobre uma superficie elevada consistente.
 */
export function ChartCard({ title, subtitle, icon: Icon, action, className = '', children }: ChartCardProps) {
  return (
    <section className={`${SURFACE.cardElevated} p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
              <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
          )}
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold tracking-tight">{title}</h3>
            {subtitle && <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
