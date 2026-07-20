import { RefreshCw } from 'lucide-react';
import { CONTROL } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';
import { SlidingTabs } from '../shared/SlidingTabs';

export type DashboardScope = 'operacional' | 'financeiro' | 'laboratorial' | 'executivo';
export type DashboardPeriod = 'hoje' | 'semana' | 'mes';

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

  const scopeItems = scopes.map((id) => ({ id, label: scopeLabels[id] }));
  const periodItems = (['hoje', 'semana', 'mes'] as DashboardPeriod[]).map((id) => ({
    id,
    label: periodLabels[id],
  }));

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      {scopes.length > 1 ? (
        <SlidingTabs
          items={scopeItems}
          active={scope}
          onChange={onScopeChange}
          size="sm"
          ariaLabel="Âmbito do painel"
        />
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {scopeLabels[scope]}
        </span>
      )}

      <div className="flex items-center gap-2">
        <SlidingTabs
          items={periodItems}
          active={period}
          onChange={onPeriodChange}
          size="sm"
          ariaLabel="Período"
        />
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
