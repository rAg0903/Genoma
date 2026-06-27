import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, BellRing, Loader2, CheckCheck, Package, Activity, AlertTriangle, Info,
  User, Receipt, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PAGE, PANEL } from '../../lib/design-tokens';
import { PageHeader } from './shared/PageHeader';
import { SlidingTabs } from './shared/SlidingTabs';
import { EmptyState } from './shared/EmptyState';
import { formatRelativeTime as formatRelativeTimeI18n, useLanguage } from '../../i18n/LanguageContext';
import {
  Notificacao,
  NotificacaoCategoria,
  NotificacaoNivel,
  notificacoesApi,
} from '../../lib/api-notificacoes';
import {
  NotificacaoFilterGroup,
  notificationMatchesFilter,
  notificationMatchesPrefs,
  readNotifPrefs,
} from '../../lib/notificacoes';

type ReadFilter = 'todas' | 'nao_lidas';
type CategoryFilter = Exclude<NotificacaoFilterGroup, 'todas' | 'nao_lidas'> | null;

const NIVEL_STYLE: Record<NotificacaoNivel, string> = {
  critico: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  aviso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const CATEGORIA_ICON: Record<NotificacaoCategoria, typeof Bell> = {
  lembrete: BellRing,
  processo_criado: Activity,
  processo_alterado: Activity,
  contacto_criado: User,
  contacto_alterado: User,
  faturacao_contacto_emitir: Receipt,
  faturacao_contacto_pago: Wallet,
  faturacao_processo_emitir: Receipt,
  faturacao_processo_pago: Wallet,
  stock: Package,
  atividade: Info,
};

const CATEGORY_FILTERS: CategoryFilter[] = [
  'processos',
  'contactos',
  'faturacao_contacto',
  'faturacao_processo',
  'stock',
  'lembretes',
];

const FILTER_GROUP_ICONS: Record<Exclude<NotificacaoFilterGroup, 'todas' | 'nao_lidas'>, typeof Bell> = {
  processos: Activity,
  contactos: User,
  faturacao_contacto: Receipt,
  faturacao_processo: Wallet,
  stock: Package,
  lembretes: BellRing,
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { t, localeTag } = useLanguage();
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<ReadFilter>('todas');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [notifPrefs, setNotifPrefs] = useState(readNotifPrefs);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificacoesApi.list({ limit: 150 });
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const syncPrefs = () => setNotifPrefs(readNotifPrefs());
    window.addEventListener('genoma:notificacoes-prefs', syncPrefs);
    return () => window.removeEventListener('genoma:notificacoes-prefs', syncPrefs);
  }, []);

  useEffect(() => {
    if (categoryFilter && !notifPrefs[categoryFilter]) {
      setCategoryFilter(null);
    }
  }, [categoryFilter, notifPrefs]);

  const prefFilteredItems = useMemo(
    () => items.filter((n) => notificationMatchesPrefs(n, notifPrefs)),
    [items, notifPrefs],
  );

  const unreadCount = useMemo(
    () => prefFilteredItems.filter((n) => !n.lida).length,
    [prefFilteredItems],
  );

  const enabledCategoryFilters = useMemo(
    () => CATEGORY_FILTERS.filter((group) => notifPrefs[group]),
    [notifPrefs],
  );

  const filtered = useMemo(() => {
    let list = prefFilteredItems;
    if (readFilter === 'nao_lidas') list = list.filter((n) => !n.lida);
    if (categoryFilter) list = list.filter((n) => notificationMatchesFilter(n, categoryFilter));
    return list;
  }, [prefFilteredItems, readFilter, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const base = readFilter === 'nao_lidas' ? prefFilteredItems.filter((n) => !n.lida) : prefFilteredItems;
    const counts: Partial<Record<CategoryFilter & string, number>> = {};
    for (const group of enabledCategoryFilters) {
      counts[group] = base.filter((n) => notificationMatchesFilter(n, group)).length;
    }
    return counts;
  }, [prefFilteredItems, readFilter, enabledCategoryFilters]);

  const handleOpen = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await notificacoesApi.markRead(n.id);
        setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, lida: true } : item)));
      } catch {
        // navega mesmo se falhar marcar como lida
      }
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await notificacoesApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, lida: true })));
      toast.success(t('pages.notifications.markAllSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages.notifications.markAllError'));
    }
  };

  const emptyTitle = readFilter === 'nao_lidas'
    ? t('pages.notifications.emptyUnread')
    : categoryFilter
      ? t('pages.notifications.emptyFilter')
      : t('pages.notifications.emptyAll');

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader
          title={t('pages.notifications.title')}
          subtitle={t('pages.notifications.subtitle')}
          action={unreadCount > 0 ? {
            label: t('pages.notifications.markAll'),
            mobileLabel: t('pages.notifications.markAllShort'),
            onClick: () => void markAllRead(),
            icon: CheckCheck,
          } : undefined}
        />

        <div className={PANEL.table}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SlidingTabs
                items={[
                  { id: 'todas' as ReadFilter, label: t('pages.notifications.filters.todas') },
                  {
                    id: 'nao_lidas' as ReadFilter,
                    label: `${t('pages.notifications.filters.naoLidas')}${unreadCount ? ` (${unreadCount})` : ''}`,
                  },
                ]}
                active={readFilter}
                onChange={setReadFilter}
                size="sm"
                ariaLabel={t('pages.notifications.filters.ariaReadState')}
              />
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 shrink-0">
                  {t('pages.notifications.unreadBadge', { count: unreadCount })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('pages.notifications.filters.ariaCategory')}>
              {enabledCategoryFilters.map((group) => {
                const count = categoryCounts[group] ?? 0;
                if (count === 0 && categoryFilter !== group) return null;
                const Icon = FILTER_GROUP_ICONS[group];
                const active = categoryFilter === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setCategoryFilter(active ? null : group)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:border-teal-500'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {t(`pages.notifications.filters.${group}`)}
                    <span className={active ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('common.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={emptyTitle}
              description={t('pages.notifications.emptyHint')}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((n) => {
                const Icon = CATEGORIA_ICON[n.categoria] || Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void handleOpen(n)}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                      !n.lida ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      n.nivel === 'critico'
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                        : n.nivel === 'aviso'
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.titulo}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {t(`pages.notifications.categoria.${n.categoria}`)}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${NIVEL_STYLE[n.nivel]}`}>
                          {n.nivel}
                        </span>
                        {!n.lida && <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{n.mensagem}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {formatRelativeTimeI18n(n.created_at, t, localeTag)}
                      </p>
                    </div>
                    {n.nivel === 'critico' && (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
