import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { KPI_TONES, KpiTone, SURFACE } from '../../../lib/design-tokens';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: KpiTone;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  onClick?: () => void;
}

/**
 * Cartao de KPI enterprise: icone tonal, valor em destaque (tabular),
 * rotulo e indicador de tendencia/ajuda. Interativo quando recebe onClick.
 */
export function KpiCard({ label, value, icon: Icon, tone = 'neutral', hint, trend, onClick }: KpiCardProps) {
  const t = KPI_TONES[tone];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`${SURFACE.card} group p-4 md:p-5 text-left w-full ${
        onClick ? 'cursor-pointer transition-all hover:shadow-[0_10px_30px_-18px_rgba(13,148,136,0.45)] ' + t.ring : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`w-10 h-10 ${t.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${t.icon}`} />
        </div>
        {onClick && (
          <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
        )}
      </div>

      <div className="text-slate-900 dark:text-slate-100 text-2xl md:text-3xl font-bold tracking-tight tabular-nums leading-none">
        {value}
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2">{label}</div>

      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={`text-[11px] font-semibold ${
                trend.positive === false
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {hint && <span className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</span>}
        </div>
      )}
    </Wrapper>
  );
}
