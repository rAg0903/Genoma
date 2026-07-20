interface ProgressMeterProps {
  value: number;
  max: number;
  label?: string;
  tone?: 'brand' | 'warning' | 'danger';
}

const TONES = {
  brand: 'bg-teal-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

/** Barra de progresso para consumo de lote / cobertura. */
export function ProgressMeter({ value, max, label, tone = 'brand' }: ProgressMeterProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const auto = pct >= 85 ? 'danger' : pct >= 60 ? 'warning' : 'brand';
  const color = TONES[tone === 'brand' ? auto : tone];
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-[11px] text-slate-400">{label}</span>}
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
