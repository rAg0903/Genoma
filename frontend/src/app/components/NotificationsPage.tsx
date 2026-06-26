import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, BellRing, Loader2, CheckCheck, Package, Activity, AlertTriangle, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { PAGE, PANEL } from '../../lib/design-tokens';
import { PageHeader } from './shared/PageHeader';
import { SlidingTabs } from './shared/SlidingTabs';
import { EmptyState } from './shared/EmptyState';
import { formatRelativeTime as formatRelativeTimeI18n, useLanguage } from '../../i18n/LanguageContext';
import {
  Notificacao,
  NotificacaoNivel,
  NotificacaoTipo,
  notificacoesApi,
} from '../../lib/api-notificacoes';

type FilterTab = 'todas' | 'nao_lidas';

const NIVEL_STYLE: Record<NotificacaoNivel, string> = {
  critico: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  aviso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const TIPO_ICON: Record<NotificacaoTipo, typeof Bell> = {
  lembrete: BellRing,
  processo: Activity,
  stock: Package,
  atividade: Info,
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { t, localeTag } = useLanguage();
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('todas');
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificacoesApi.list({ limit: 100 });
      setItems(res.data || []);
      setUnreadCount(res.unreadCount ?? 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (tab === 'nao_lidas') return items.filter((n) => !n.lida);
    return items;
  }, [items, tab]);

  const handleOpen = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await notificacoesApi.markRead(n.id);
        setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, lida: true } : item)));
        setUnreadCount((c) => Math.max(0, c - 1));
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
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível marcar as notificações.');
    }
  };

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader
          title={t('pages.notifications.title')}
          subtitle={t('pages.notifications.subtitle')}
          action={unreadCount > 0 ? { label: 'Marcar todas como lidas', mobileLabel: 'Marcar lidas', onClick: () => void markAllRead(), icon: CheckCheck } : undefined}
        />

        <div className={PANEL.table}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <SlidingTabs
              items={[
                { id: 'todas' as FilterTab, label: 'Todas' },
                { id: 'nao_lidas' as FilterTab, label: `Não lidas${unreadCount ? ` (${unreadCount})` : ''}` },
              ]}
              active={tab}
              onChange={setTab}
              size="sm"
              ariaLabel="Filtrar notificações"
            />
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {unreadCount} por ler
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={tab === 'nao_lidas' ? t('pages.notifications.emptyUnread') : t('pages.notifications.emptyAll')}
              description="Quando houver lembretes, alertas de stock, processos ou atividade recente, aparecerão aqui."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((n) => {
                const Icon = TIPO_ICON[n.tipo] || Bell;
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
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${NIVEL_STYLE[n.nivel]}`}>
                          {n.nivel}
                        </span>
                        {!n.lida && <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{n.mensagem}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatRelativeTimeI18n(n.created_at, t, localeTag)}</p>
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
