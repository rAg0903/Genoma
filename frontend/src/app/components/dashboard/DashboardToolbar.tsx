import { RefreshCw } from 'lucide-react';
import { CONTROL } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';

export type DashboardScope = 'operacional' | 'financeiro' | 'laboratorial' | 'executivo';
export type DashboardPeriod = 'hoje' | 'semana' | 'mes';

interface SegmentProps<T extends string> {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}

function Segment<T extends string>({ options, labels, value, onChange }: SegmentProps<T>) {
  return (
    <div className={CONTROL.segment}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${CONTROL.segmentItem} ${value === opt ? CONTROL.segmentItemActive : CONTROL.segmentItemIdle}`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

interface DashboardToolbarProps {
  scopes: DashboardScope[];
  scope: DashboardScope;
  onScopeChange: (s: DashboardScope) => void;
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  onRefresh: () => void;
  loading?: boolean;
  updatedAt?: Date | null;
}

export function DashboardToolbar({
  scopes, scope, onScopeChange, period, onPeriodChange, onRefresh, loading, updatedAt,
}: DashboardToolbarProps) {
  const { t, localeTag } = useLanguage();

  const scopeLabels: Record<DashboardScope, string> = {
    operacional: t('dashboard.scopes.operacional'),
    laboratorial: t('dashboard.scopes.laboratorial'),
    financeiro: t('dashboard.scopes.financeiro'),
    executivo: t('dashboard.scopes.executivo'),
  };

  const periodLabels: Record<DashboardPeriod, string> = {
    hoje: t('dashboard.periods.hoje'),
    semana: t('dashboard.periods.semana'),
    mes: t('dashboard.periods.mes'),
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      {scopes.length > 1 ? (
        <Segment options={scopes} labels={scopeLabels} value={scope} onChange={onScopeChange} />
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {scopeLabels[scope]}
        </span>
      )}

      <div className="flex items-center gap-2">
        <Segment options={['hoje', 'semana', 'mes']} labels={periodLabels} value={period} onChange={onPeriodChange} />
        <button onClick={onRefresh} className={CONTROL.buttonGhost} title={t('common.refresh')}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {updatedAt ? updatedAt.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }) : t('common.refresh')}
          </span>
        </button>
      </div>
    </div>
  );
}
