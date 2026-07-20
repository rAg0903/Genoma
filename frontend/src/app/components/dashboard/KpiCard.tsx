import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { CARD, KPI_TONES, KpiTone, SURFACE, TYPOGRAPHY } from '../../../lib/design-tokens';

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
 * Cartao de KPI enterprise: layout horizontal para aproveitar largura,
 * icone tonal, valor em destaque e rotulo compacto.
 */
export function KpiCard({ label, value, icon: Icon, tone = 'neutral', hint, trend, onClick }: KpiCardProps) {
  const t = KPI_TONES[tone];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`${SURFACE.card} group ${CARD.paddingComfort} text-left w-full h-full min-w-0 flex items-start gap-3 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-[0_8px_24px_-16px_rgba(13,148,136,0.45)] ' + t.ring : ''
      }`}
    >
      <div className={`${CARD.iconBox} ${t.iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`${CARD.iconSize} ${t.icon}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-slate-900 dark:text-slate-100 ${TYPOGRAPHY.metric} leading-none`}>
          {value}
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mt-1 leading-snug line-clamp-2">
          {label}
        </div>
        {(hint || trend) && (
          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            {trend && (
              <span
                className={`text-[10px] font-semibold ${
                  trend.positive === false
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {hint && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{hint}</span>
            )}
          </div>
        )}
      </div>

      {onClick && (
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-0.5" />
      )}
    </Wrapper>
  );
}
