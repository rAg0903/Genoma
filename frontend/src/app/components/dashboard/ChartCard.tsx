import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { CARD, SURFACE } from '../../../lib/design-tokens';

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
    <section className={`${SURFACE.cardElevated} ${CARD.paddingComfort} ${className}`}>
      <header className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          {Icon && (
            <div className={`${CARD.iconBox} bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`${CARD.iconSize} text-slate-500 dark:text-slate-400`} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold tracking-tight">{title}</h3>
            {subtitle && <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
