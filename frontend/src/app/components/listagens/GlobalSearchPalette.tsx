import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Loader2, Activity, FlaskConical, Users, Stethoscope, Package, Boxes, ArrowRight, type LucideIcon } from 'lucide-react';
import { listagensApi, SearchGroup, SearchResultItem } from '../../../lib/api-listagens';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const TIPO_ICON: Record<string, typeof Activity> = {
  processo: Activity,
  resultado: FlaskConical,
  paciente: Users,
  medico: Stethoscope,
  kit: Package,
  lote: Boxes,
};

type SearchCategoryId = 'contactos' | 'processos' | 'resultados' | 'medicos' | 'kits' | 'lotes';

type SearchCategoryDef = {
  id: SearchCategoryId;
  query: SearchCategoryId;
  icon: LucideIcon;
};

const SEARCH_CATEGORIES: SearchCategoryDef[] = [
  { id: 'contactos', query: 'contactos', icon: Users },
  { id: 'processos', query: 'processos', icon: Activity },
  { id: 'resultados', query: 'resultados', icon: FlaskConical },
  { id: 'medicos', query: 'medicos', icon: Stethoscope },
  { id: 'kits', query: 'kits', icon: Package },
  { id: 'lotes', query: 'lotes', icon: Boxes },
];

const MEDICO_CATEGORY_IDS = new Set<SearchCategoryId>(['contactos', 'processos', 'resultados']);

const GROUP_HEADING_CLASS =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400';

const ITEM_CLASS =
  'flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-teal-50 dark:data-[selected=true]:bg-teal-900/20 transition';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: SearchResultItem['target']) => void;
}

/**
 * Pesquisa global instantanea (command palette) sobre processos, resultados,
 * contactos, medicos, kits e lotes. Abre com Ctrl/Cmd+K.
 */
export function GlobalSearchPalette({ open, onClose, onNavigate }: Props) {
  const { t } = useLanguage();
  const { role, hasPermission } = useAuth();
  const [value, setValue] = useState('');
  const [grupos, setGrupos] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  const categories = useMemo(() => {
    return SEARCH_CATEGORIES.filter((cat) => {
      if (role === 'Medico') return MEDICO_CATEGORY_IDS.has(cat.id);
      if (cat.id === 'kits' || cat.id === 'lotes') return hasPermission('stocks', 'read');
      return true;
    });
  }, [hasPermission, role]);

  const tips = useMemo(() => {
    const keys = role === 'Medico'
      ? (['contact', 'process', 'result'] as const)
      : (['contact', 'process', 'result', 'doctor', 'stock'] as const);
    return keys.map((key) => t(`common.globalSearchTips.${key}`));
  }, [role, t]);

  useEffect(() => {
    if (!open) { setValue(''); setGrupos([]); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    if (q.length < 2) { setGrupos([]); setLoading(false); return; }
    setLoading(true);
    const current = ++reqId.current;
    const handle = setTimeout(async () => {
      try {
        const res = await listagensApi.search(q);
        if (current === reqId.current) setGrupos(res);
      } catch {
        if (current === reqId.current) setGrupos([]);
      } finally {
        if (current === reqId.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [value, open]);

  if (!open) return null;

  const total = grupos.reduce((n, g) => n + g.itens.length, 0);
  const showHints = value.trim().length < 2;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <Command
        shouldFilter={false}
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 border-b border-slate-100 dark:border-slate-800">
          {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
          <Command.Input
            autoFocus
            value={value}
            onValueChange={setValue}
            placeholder={t('common.globalSearchPlaceholder')}
            className="flex-1 py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">{t('common.closeShortcut')}</kbd>
        </div>

        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          {showHints ? (
            <div className="px-1 py-2 space-y-4">
              <Command.Group heading={t('common.globalSearchBrowseTitle')} className={GROUP_HEADING_CLASS}>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const meta = t(`common.globalSearchCategories.${cat.id}.label`);
                  const hint = t(`common.globalSearchCategories.${cat.id}.hint`);
                  return (
                    <Command.Item
                      key={cat.id}
                      value={`browse-${cat.id}`}
                      onSelect={() => setValue(cat.query)}
                      className={ITEM_CLASS}
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-800 dark:text-slate-100">{meta}</span>
                        <span className="block text-xs text-slate-400 truncate">{hint}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <div>
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t('common.globalSearchTipsTitle')}
                </p>
                <ul className="px-2 space-y-1.5">
                  {tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : !loading && total === 0 ? (
            <Command.Empty className="px-3 py-8 text-center text-sm text-slate-400">{t('common.globalSearchNoResults', { query: value })}</Command.Empty>
          ) : (
            grupos.map((grupo) => {
              const Icon = TIPO_ICON[grupo.tipo] || Activity;
              return (
                <Command.Group
                  key={grupo.tipo}
                  heading={grupo.label}
                  className={GROUP_HEADING_CLASS}
                >
                  {grupo.itens.map((item) => (
                    <Command.Item
                      key={`${grupo.tipo}-${item.id}`}
                      value={`${grupo.tipo}-${item.id}-${item.label}`}
                      onSelect={() => onNavigate(item.target)}
                      className={ITEM_CLASS}
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-800 dark:text-slate-100 truncate">{item.label}</span>
                        {item.sublabel && <span className="block text-xs text-slate-400 truncate">{item.sublabel}</span>}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })
          )}
        </Command.List>
      </Command>
    </div>
  );
}