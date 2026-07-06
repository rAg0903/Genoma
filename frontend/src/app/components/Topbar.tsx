import { Search, Bell, X, Sun, Moon, Loader2, Languages, Check } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Notificacao, notificacoesApi } from '../../lib/api-notificacoes';
import { notificationMatchesPrefs, readNotifPrefs } from '../../lib/notificacoes';
import { formatRelativeTime, LanguagePreference, useLanguage } from '../../i18n/LanguageContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { useTheme } from '../context/ThemeContext';
import { useGlobalSearch } from '../context/GlobalSearchContext';
import { getAdminBreadcrumbItems } from '../../lib/admin-breadcrumbs';
import { getContactBreadcrumbItems, getProcessBreadcrumbItems } from '../../lib/entity-breadcrumbs';
import { APP } from '../../lib/design-tokens';
import { useData } from '../context/DataContext';

interface TopbarProps {
  onMenuToggle: () => void;
}

const ROUTE_LABEL_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/contactos': 'nav.contacts',
  '/colheitas-hoje': 'nav.colheitasHoje',
  '/processos': 'nav.processes',
  '/stocks': 'nav.stocks',
  '/listagens': 'nav.listings',
  '/definicoes': 'nav.administration',
  '/perfil': 'nav.profile',
  '/notificacoes': 'nav.notifications',
};

function getBreadcrumbItems(
  pathname: string,
  t: (key: string) => string,
  ctx: { processos: { id: string; numero: string }[]; contacts: { id: string; nome: string }[] },
) {
  if (pathname === '/') {
    return [{ path: '/', label: t('nav.dashboard') }];
  }

  const adminItems = getAdminBreadcrumbItems(pathname, t);
  if (adminItems) return adminItems;

  const processItems = getProcessBreadcrumbItems(pathname, t, ctx.processos);
  if (processItems) return processItems;

  const contactItems = getContactBreadcrumbItems(pathname, t, ctx.contacts);
  if (contactItems) return contactItems;

  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    return {
      path,
      label: ROUTE_LABEL_KEYS[path] ? t(ROUTE_LABEL_KEYS[path]) : formatSegmentLabel(segment),
    };
  });
}

function formatSegmentLabel(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t, localeTag, language, setLanguage } = useLanguage();
  const { openSearch } = useGlobalSearch();
  const { processos, contacts } = useData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(readNotifPrefs);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const languageOptions = useMemo(
    () => [
      { value: 'auto' as LanguagePreference, label: t('settings.languageAuto') },
      { value: 'pt' as LanguagePreference, label: t('settings.languagePt') },
    ],
    [t],
  );

  const handleLanguageChange = (value: LanguagePreference) => {
    setLanguage(value);
    toast.success(t('settings.languageChanged'));
    setLangOpen(false);
  };

  useEffect(() => {
    const syncPrefs = () => setNotifPrefs(readNotifPrefs());
    window.addEventListener('genoma:notificacoes-prefs', syncPrefs);
    return () => window.removeEventListener('genoma:notificacoes-prefs', syncPrefs);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await notificacoesApi.list({ limit: 50 });
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => { void loadNotifications(); }, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (notifOpen) void loadNotifications();
  }, [notifOpen, loadNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotification = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await notificacoesApi.markRead(n.id);
        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, lida: true } : item)));
      } catch {
        // continua para navegação
      }
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
    else navigate('/notificacoes');
  };

  const breadcrumbItems = useMemo(
    () => getBreadcrumbItems(pathname, t, { processos, contacts }),
    [pathname, t, processos, contacts],
  );
  const pageLabel = breadcrumbItems[breadcrumbItems.length - 1]?.label ?? t('nav.dashboard');

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => notificationMatchesPrefs(n, notifPrefs)),
    [notifications, notifPrefs],
  );
  const displayNotifications = visibleNotifications.slice(0, 8);
  const visibleUnreadCount = visibleNotifications.filter((n) => !n.lida).length;

  const searchShortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform)
    ? '⌘K'
    : 'Ctrl K';

  return (
    <div className={`h-16 flex items-center justify-between px-4 md:px-5 flex-shrink-0 gap-3 relative z-40 overflow-visible ${APP.topbar}`}>
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
        aria-label={t('nav.openMenu')}
        title={t('nav.openMenu')}
      >
        <img
          src="/symbol_genoma.png"
          alt=""
          className="w-6 h-6 object-contain"
          aria-hidden="true"
        />
      </button>

      <div className="min-w-0 flex-1 flex items-center gap-3">
        <div className="lg:hidden min-w-0">
          <div className="text-slate-800 dark:text-slate-100 truncate" style={{ fontSize: '14px', fontWeight: 600 }}>
            {pageLabel}
          </div>
        </div>

        <div className="hidden lg:block min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="text-[13px] text-slate-500 dark:text-slate-400">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">{t('nav.application')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                return (
                  <React.Fragment key={item.path}>
                    <BreadcrumbSeparator className="text-slate-300 dark:text-slate-600" />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-slate-800 dark:text-slate-100 font-medium">{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={item.path} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={openSearch}
          className="relative w-full flex items-center gap-2 pl-9 pr-3 py-2 bg-white dark:bg-[#1f2a3d] border border-slate-200 dark:border-[#334155]/65 rounded-full text-left text-slate-400 dark:text-slate-500 hover:border-teal-300 dark:hover:border-teal-600/50 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all group focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          aria-label={t('common.globalSearchAria')}
          title={t('common.globalSearchAria')}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
          <span className="flex-1 truncate" style={{ fontSize: '13px' }}>
            {t('common.globalSearchPlaceholder')}
          </span>
          <kbd className="hidden lg:inline-flex items-center shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 group-hover:border-teal-200 dark:group-hover:border-teal-800">
            {searchShortcut}
          </kbd>
        </button>
      </div>

      <button
        type="button"
        onClick={openSearch}
        className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label={t('common.globalSearchAria')}
        title={t('common.globalSearchAria')}
      >
        <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <div className="relative overflow-visible" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangOpen((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={t('settings.language')}
            title={t('settings.language')}
          >
            <Languages className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1f2a3d] rounded-xl shadow-xl border border-slate-200 dark:border-[#334155]/65 z-[100] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-slate-100 text-[13px] font-semibold">{t('settings.language')}</span>
              </div>
              <div className="p-1.5">
                {languageOptions.map((option) => {
                  const isActive = language === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleLanguageChange(option.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-teal-700/80 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#243044]'
                      }`}
                      style={{ fontSize: '13px' }}
                    >
                      <span>{option.label}</span>
                      {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={isDark ? t('theme.lightMode') : t('theme.darkMode')}
          title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        >
          {isDark
            ? <Sun className="w-5 h-5 text-amber-400" />
            : <Moon className="w-5 h-5 text-slate-600" />
          }
        </button>

        <div className="relative overflow-visible" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label={visibleUnreadCount > 0 ? t('nav.notificationsUnread', { count: visibleUnreadCount }) : t('nav.notifications')}
            className="relative flex items-center justify-center w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors overflow-visible"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
            {visibleUnreadCount > 0 && (
              <span
                className={`absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white font-bold rounded-full border-2 border-slate-50 dark:border-[#161f30] flex items-center justify-center tabular-nums leading-none pointer-events-none ${
                  visibleUnreadCount >= 100 ? 'min-w-[26px] h-[18px] px-1 text-[9px]' : visibleUnreadCount >= 10 ? 'min-w-[22px] h-[18px] px-1 text-[9px]' : 'min-w-[18px] h-[18px] px-1 text-[10px]'
                }`}
              >
                {visibleUnreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1f2a3d] rounded-xl shadow-xl border border-slate-200 dark:border-[#334155]/65 z-[100]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-slate-100" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {t('nav.notifications')}{visibleUnreadCount > 0 ? ` (${visibleUnreadCount})` : ''}
                </span>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {notifLoading && displayNotifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('common.loading')}
                  </div>
                ) : displayNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400" style={{ fontSize: '13px' }}>
                    {t('nav.noNotifications')}
                  </div>
                ) : (
                  displayNotifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => void openNotification(n)}
                      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors ${!n.lida ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.lida ? 'bg-teal-500 dark:bg-teal-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 font-medium" style={{ fontSize: '12px', lineHeight: 1.3 }}>{n.titulo}</p>
                        <p className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', lineHeight: 1.4 }}>{n.mensagem}</p>
                        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: '11px', marginTop: 2 }}>{formatRelativeTime(n.created_at, t, localeTag)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setNotifOpen(false); navigate('/notificacoes'); }}
                  className="w-full text-center text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  {t('nav.viewAllNotifications')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}