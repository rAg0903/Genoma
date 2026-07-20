import { useEffect, useState } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { CARD, KPI_TONES, KpiTone, LAYOUT, SURFACE, formatNumber } from '../../../lib/design-tokens';
import { medicosApi } from '../../../lib/api-medicos';

export type AdminModuleCardId =
  | 'utilizadores'
  | 'permissoes'
  | 'empresas'
  | 'tipos_kit'
  | 'entidades'
  | 'laboratorios'
  | 'medicos'
  | 'motivos_anulacao'
  | 'sistema';

export type AdminModuleCardDef = {
  id: AdminModuleCardId;
  label: string;
  description: string;
  icon: LucideIcon;
  tone?: KpiTone;
  count?: number;
  countFromApi?: 'medicos';
};

type AdminModuleCardsProps = {
  modules: AdminModuleCardDef[];
  onSelect: (id: AdminModuleCardId) => void;
};

function AdminModuleCard({
  module,
  onSelect,
  medicosCount,
}: {
  module: AdminModuleCardDef;
  onSelect: (id: AdminModuleCardId) => void;
  medicosCount?: number;
}) {
  const tone = KPI_TONES[module.tone ?? 'brand'];
  const Icon = module.icon;
  const count = module.countFromApi === 'medicos' ? medicosCount : module.count;

  return (
    <button
      type="button"
      onClick={() => onSelect(module.id)}
      className={`${SURFACE.card} group ${CARD.paddingComfort} text-left w-full h-full min-w-0 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-[0_8px_24px_-16px_rgba(13,148,136,0.45)] ${tone.ring}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${CARD.iconBox} ${tone.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`${CARD.iconSize} ${tone.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {module.label}
            </h3>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
            {module.description}
          </p>
        </div>
      </div>

      {count !== undefined && (
        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
          {formatNumber(count)} {count === 1 ? 'registo' : 'registos'}
        </div>
      )}
    </button>
  );
}

export function AdminModuleCards({ modules, onSelect }: AdminModuleCardsProps) {
  const needsMedicosCount = modules.some((m) => m.countFromApi === 'medicos');
  const [medicosCount, setMedicosCount] = useState<number | undefined>();

  useEffect(() => {
    if (!needsMedicosCount) return;
    let cancelled = false;
    void medicosApi.list()
      .then((list) => {
        if (!cancelled) setMedicosCount(list.length);
      })
      .catch(() => {
        if (!cancelled) setMedicosCount(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [needsMedicosCount]);

  if (modules.length === 0) {
    return (
      <div className={`${SURFACE.cardElevated} p-8 text-center text-sm text-slate-500`}>
        Sem submodulos disponiveis para o perfil atual.
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 ${LAYOUT.gridGap}`}>
      {modules.map((module) => (
        <AdminModuleCard
          key={module.id}
          module={module}
          onSelect={onSelect}
          medicosCount={medicosCount}
        />
      ))}
    </div>
  );
}
