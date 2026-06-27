import { Fragment } from 'react';
import {
  Activity,
  Box,
  Check,
  Eye,
  FileText,
  Home,
  Minus,
  Pencil,
  Plus,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { PerfilPermissionBundle } from '../../../lib/perfil-permissions';
import {
  DefinicoesSubmodule,
  DEFINICOES_SUBMODULES,
  ListingsSubmodule,
  LISTINGS_SUBMODULES,
  PermissionAction,
  PermissionModule,
  StockSubmodule,
  STOCK_SUBMODULES,
} from '../../../lib/permissions';
import { ADMIN_TH_CLASS } from './admin-tab-ui';

const MODULE_NAV_KEYS: Record<PermissionModule, string> = {
  dashboard: 'nav.dashboard',
  contactos: 'nav.contacts',
  processos: 'nav.processes',
  stocks: 'nav.stocks',
  listagens: 'nav.listings',
  definicoes: 'nav.admin',
};

const MODULE_ICONS: Record<PermissionModule, typeof Home> = {
  dashboard: Home,
  contactos: User,
  processos: Activity,
  stocks: Box,
  listagens: FileText,
  definicoes: Settings,
};

const MODULE_ICON_BOX_CLASS =
  'flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800';

const MODULE_ICON_CLASS = 'w-4 h-4 text-slate-600 dark:text-slate-300';

const ACTION_LABELS: Record<PermissionAction, string> = {
  read: 'Ler',
  create: 'Inserir',
  update: 'Editar',
  delete: 'Apagar',
};

const ACTION_HINTS: Record<PermissionAction, string> = {
  read: 'Consultar',
  create: 'Criar registos',
  update: 'Alterar registos',
  delete: 'Eliminar registos',
};

const STOCK_LABEL_KEYS: Record<StockSubmodule, string> = {
  lotes: 'navSub.lotes',
  requisicoes: 'navSub.requisicoes',
  descartes: 'navSub.descartes',
};

const LISTINGS_LABEL_KEYS: Record<ListingsSubmodule, string> = {
  painel_bordo: 'listings.painel_bordo',
  resultados: 'listings.resultados',
  faturacao: 'listings.faturacao',
  colheitas: 'listings.colheitas',
  kits: 'listings.kits',
  lotes: 'listings.lotes',
  auditoria: 'listings.auditoria',
};

const DEFINICOES_LABEL_KEYS: Record<DefinicoesSubmodule, string> = {
  utilizadores: 'navSub.utilizadores',
  permissoes: 'navSub.permissoes',
  empresas: 'navSub.empresas',
  testes: 'navSub.testes',
  tipos_kit: 'navSub.tipos_kit',
  entidades: 'navSub.entidades',
  laboratorios: 'navSub.laboratorios',
  medicos: 'navSub.medicos',
  motivos_anulacao: 'navSub.motivos_anulacao',
};

const ORDERED_MODULES: PermissionModule[] = [
  'dashboard',
  'contactos',
  'processos',
  'stocks',
  'listagens',
  'definicoes',
];

const ORDERED_ACTIONS: PermissionAction[] = ['read', 'create', 'update', 'delete'];

const MODULE_SUBMODULES: Partial<Record<PermissionModule, string[]>> = {
  stocks: STOCK_SUBMODULES,
  listagens: LISTINGS_SUBMODULES,
  definicoes: DEFINICOES_SUBMODULES,
};

const ACTION_ICONS: Record<PermissionAction, typeof Eye> = {
  read: Eye,
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

type PermissionsMatrixProps = {
  bundle: PerfilPermissionBundle;
  readOnly: boolean;
  onToggleModule: (module: PermissionModule, action: PermissionAction, value: boolean) => void;
  onToggleStock: (submodule: StockSubmodule, value: boolean) => void;
  onToggleListings: (submodule: ListingsSubmodule, value: boolean) => void;
  onToggleDefinicoes: (submodule: DefinicoesSubmodule, value: boolean) => void;
};

function getSubmoduleLabelKey(module: PermissionModule, submodule: string) {
  if (module === 'stocks') return STOCK_LABEL_KEYS[submodule as StockSubmodule];
  if (module === 'listings') return LISTINGS_LABEL_KEYS[submodule as ListingsSubmodule];
  if (module === 'definicoes') return DEFINICOES_LABEL_KEYS[submodule as DefinicoesSubmodule];
  return submodule;
}

function getSubmoduleChecked(bundle: PerfilPermissionBundle, module: PermissionModule, submodule: string) {
  if (module === 'stocks') return bundle.stock[submodule as StockSubmodule];
  if (module === 'listings') return bundle.listings[submodule as ListingsSubmodule];
  if (module === 'definicoes') return bundle.definicoes[submodule as DefinicoesSubmodule];
  return false;
}

function countModulePermissions(bundle: PerfilPermissionBundle, module: PermissionModule) {
  const perms = bundle.modules[module];
  const active = ORDERED_ACTIONS.filter((a) => perms[a]).length;
  const submodules = MODULE_SUBMODULES[module] ?? [];
  const subActive = submodules.filter((s) => getSubmoduleChecked(bundle, module, s)).length;
  const total = ORDERED_ACTIONS.length + submodules.length;
  return { active: active + subActive, total };
}

type MatrixCellProps = {
  checked?: boolean;
  disabled?: boolean;
  na?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
};

function MatrixCell({ checked = false, disabled = false, na = false, onChange, label }: MatrixCellProps) {
  if (na) {
    return (
      <td className="w-[72px] px-2 py-2.5 text-center align-middle">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 dark:text-slate-600"
          aria-hidden
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
      </td>
    );
  }

  return (
    <td className="w-[72px] px-2 py-2.5 text-center align-middle">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={[
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-150',
          checked
            ? 'border-teal-300 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
            : 'border-slate-200 bg-white text-teal-600 dark:border-slate-700 dark:bg-slate-900',
          disabled
            ? 'cursor-not-allowed opacity-35'
            : checked
              ? 'hover:border-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-950/70'
              : 'cursor-pointer hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800/60',
        ].join(' ')}
      >
        <Check
          className={`w-4 h-4 transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
          strokeWidth={2.5}
        />
      </button>
    </td>
  );
}

export function PermissionsMatrix({
  bundle,
  readOnly,
  onToggleModule,
  onToggleStock,
  onToggleListings,
  onToggleDefinicoes,
}: PermissionsMatrixProps) {
  const { t } = useLanguage();

  const moduleLabel = (module: PermissionModule) => t(MODULE_NAV_KEYS[module]);
  const submoduleLabel = (module: PermissionModule, submodule: string) => t(getSubmoduleLabelKey(module, submodule));

  const handleToggleSubmodule = (module: PermissionModule, submodule: string, checked: boolean) => {
    if (readOnly) return;
    if (module === 'stocks') onToggleStock(submodule as StockSubmodule, checked);
    if (module === 'listings') onToggleListings(submodule as ListingsSubmodule, checked);
    if (module === 'definicoes') onToggleDefinicoes(submodule as DefinicoesSubmodule, checked);
  };

  const handleToggle = (module: PermissionModule, action: PermissionAction, checked: boolean) => {
    if (readOnly) return;
    onToggleModule(module, action, checked);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="min-w-[240px] px-5 py-3.5 text-left">
                <span className={ADMIN_TH_CLASS}>Módulo</span>
              </th>
              {ORDERED_ACTIONS.map((action) => {
                const Icon = ACTION_ICONS[action];
                return (
                  <th key={action} className="w-[72px] px-2 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </span>
                      <span className={ADMIN_TH_CLASS}>{ACTION_LABELS[action]}</span>
                      <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500 hidden lg:block">
                        {ACTION_HINTS[action]}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ORDERED_MODULES.map((module, moduleIndex) => {
              const modulePermissions = bundle.modules[module];
              const canReadModule = modulePermissions.read;
              const submodules = MODULE_SUBMODULES[module] ?? [];
              const ModuleIcon = MODULE_ICONS[module];
              const { active, total } = countModulePermissions(bundle, module);
              const isLastModule = moduleIndex === ORDERED_MODULES.length - 1;

              return (
                <Fragment key={module}>
                  <tr
                    className={[
                      'group bg-white dark:bg-slate-900 transition-colors',
                      !isLastModule || submodules.length > 0 ? 'border-b border-slate-100 dark:border-slate-800/80' : '',
                    ].join(' ')}
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={MODULE_ICON_BOX_CLASS}>
                          <ModuleIcon className={MODULE_ICON_CLASS} strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {moduleLabel(module)}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {active}/{total} ativas
                          </p>
                        </div>
                      </div>
                    </td>
                    {ORDERED_ACTIONS.map((action) => {
                      const checked = modulePermissions[action];
                      const disabled = readOnly || (!canReadModule && action !== 'read');
                      return (
                        <MatrixCell
                          key={action}
                          checked={checked}
                          disabled={disabled}
                          onChange={(v) => handleToggle(module, action, v)}
                          label={`${moduleLabel(module)} — ${ACTION_LABELS[action]}`}
                        />
                      );
                    })}
                  </tr>

                  {submodules.map((submodule, subIndex) => {
                    const checked = getSubmoduleChecked(bundle, module, submodule);
                    const disabled = readOnly || !canReadModule;
                    const isLastSub = subIndex === submodules.length - 1;

                    return (
                      <tr
                        key={`${module}-${submodule}`}
                        className={[
                          'bg-slate-50/60 dark:bg-slate-800/25 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/40',
                          !isLastModule || !isLastSub ? 'border-b border-slate-100 dark:border-slate-800/60' : '',
                        ].join(' ')}
                      >
                        <td className="px-5 py-2.5 align-middle">
                          <div className="flex items-center gap-2 pl-[18px] min-w-0">
                            <span className="relative flex-shrink-0 w-4 self-stretch flex items-center justify-center">
                              <span className="absolute left-1/2 top-0 bottom-1/2 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
                              <span className="absolute left-1/2 top-1/2 h-px w-2.5 -translate-y-1/2 bg-slate-200 dark:bg-slate-700" />
                              <span className="relative z-[1] h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                              {submoduleLabel(module, submodule)}
                            </span>
                          </div>
                        </td>
                        {ORDERED_ACTIONS.map((action) =>
                          action === 'read' ? (
                            <MatrixCell
                              key={action}
                              checked={checked}
                              disabled={disabled}
                              onChange={(v) => handleToggleSubmodule(module, submodule, v)}
                              label={`${submoduleLabel(module, submodule)} — ${ACTION_LABELS[action]}`}
                            />
                          ) : (
                            <MatrixCell key={action} na label="" />
                          ),
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Legenda</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50">
            <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
          </span>
          Permissão ativa
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          Sem permissão
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Minus className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          Não aplicável
        </span>
      </div>
    </div>
  );
}
