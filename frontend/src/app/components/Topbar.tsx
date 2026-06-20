import { Search, Bell, X, Sun, Moon, Menu, Loader2, Languages, Check } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Notificacao, notificacoesApi } from '../../lib/api-notificacoes';
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

interface TopbarProps {
  onMenuToggle: () => void;
}

const ROUTE_LABEL_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/contactos': 'nav.contacts',
  '/processos': 'nav.processes',
  '/stocks': 'nav.stocks',
  '/listagens': 'nav.listings',
  '/definicoes': 'nav.administration',
  '/definicoes/testes/novo': 'nav.newTest',
  '/definicoes/testes': 'nav.tests',
  '/definicoes/medicos/novo': 'nav.newDoctor',
  '/definicoes/medicos': 'nav.doctors',
  '/definicoes/laboratorios/novo': 'navSub.laboratorios',
  '/definicoes/entidades/novo': 'navSub.entidades',
  '/perfil': 'nav.profile',
  '/notificacoes': 'nav.notifications',
};

function getBreadcrumbItems(pathname: string, t: (key: string) => string) {
  if (pathname === '/') {
    return [{ path: '/', label: t('nav.dashboard') }];
  }

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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const languageOptions = useMemo(
    () => [
      { value: 'auto' as LanguagePreference, label: t('settings.languageAuto') },
      { value: 'pt' as LanguagePreference, label: t('settings.languagePt') },
      { value: 'en' as LanguagePreference, label: t('settings.languageEn') },
    ],
    [t],
  );

  const handleLanguageChange = (value: LanguagePreference) => {
    setLanguage(value);
    toast.success(t('settings.languageChanged'));
    setLangOpen(false);
  };

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await notificacoesApi.list({ limit: 8 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
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
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // continua para navegação
      }
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
    else navigate('/notificacoes');
  };

  const breadcrumbItems = useMemo(() => getBreadcrumbItems(pathname, t), [pathname, t]);
  const pageLabel = breadcrumbItems[breadcrumbItems.length - 1]?.label ?? t('nav.dashboard');

  return (
    <div className="h-16 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-5 flex-shrink-0 gap-3 relative z-40 overflow-visible">
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
        aria-label={t('nav.openMenu')}
        title={t('nav.openMenu')}
      >
        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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

      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            name="global-search"
            placeholder={t('common.search')}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            style={{ fontSize: '13px' }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(!searchOpen)}
        className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label={searchOpen ? t('nav.closeSearch') : t('nav.openSearch')}
        title={searchOpen ? t('nav.closeSearch') : t('nav.openSearch')}
        aria-expanded={searchOpen}
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
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden">
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
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
            aria-label={unreadCount > 0 ? t('nav.notificationsUnread', { count: unreadCount }) : t('nav.notifications')}
            className="relative flex items-center justify-center w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors overflow-visible"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
            {unreadCount > 0 && (
              <span
                className={`absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white font-bold rounded-full border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center tabular-nums leading-none pointer-events-none ${
                  unreadCount >= 100 ? 'min-w-[26px] h-[18px] px-1 text-[9px]' : unreadCount >= 10 ? 'min-w-[22px] h-[18px] px-1 text-[9px]' : 'min-w-[18px] h-[18px] px-1 text-[10px]'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-slate-100" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {t('nav.notifications')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </span>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('common.loading')}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400" style={{ fontSize: '13px' }}>
                    {t('nav.noNotifications')}
                  </div>
                ) : (
                  notifications.map((n) => (
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

      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              autoFocus
              type="text"
              name="mobile-search"
              placeholder={t('common.search')}
              className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              style={{ fontSize: '14px' }}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              aria-label={t('nav.closeSearch')}
              title={t('nav.closeSearch')}
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}