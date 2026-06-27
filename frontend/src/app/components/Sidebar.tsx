import { NavLink, useLocation } from 'react-router';
import { useMemo } from 'react';
import { Home, User, Activity, Box, FileText, Settings, ChevronDown, X } from 'lucide-react';
import { UserAccountMenu } from './shared/UserAccountMenu';
import { UserAvatar } from './shared/UserAvatar';
import { GenomaLogo } from './shared/GenomaLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { DefinicoesSubmodule, ListingsSubmodule, PermissionModule, StockSubmodule } from '../../lib/permissions';
import { LISTING_ORDER } from './listagens/listingConfig';
import { formatUtilizadorNome } from '../../lib/utilizadores';

type MenuSubItemId =
  | 'kits'
  | 'lotes'
  | 'requisicoes'
  | 'descartes'
  | 'auditoria'
  | 'exames'
  | 'painel_bordo'
  | 'processos'
  | 'resultados'
  | 'faturacao'
  | 'colheitas'
  | 'pacientes'
  | 'utilizadores'
  | 'permissoes'
  | 'empresas'
  | 'testes'
  | 'tipos_kit'
  | 'entidades'
  | 'laboratorios'
  | 'medicos'
  | 'motivos_anulacao';

type MenuItem = {
  path: string;
  labelKey: string;
  icon: typeof Home;
  end: boolean;
  module: PermissionModule;
  subItems?: { id: MenuSubItemId; labelKey: string; path: string }[];
  defaultSubItemId?: MenuSubItemId;
};

const menuItemDefs: MenuItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: Home, end: true, module: 'dashboard' as PermissionModule },
  { path: '/contactos', labelKey: 'nav.contacts', icon: User, end: false, module: 'contactos' as PermissionModule },
  { path: '/processos', labelKey: 'nav.processes', icon: Activity, end: false, module: 'processos' as PermissionModule },
  {
    path: '/stocks',
    labelKey: 'nav.stocks',
    icon: Box,
    end: false,
    module: 'stocks' as PermissionModule,
    defaultSubItemId: 'lotes',
    subItems: [
      { id: 'lotes', labelKey: 'navSub.lotes', path: '/stocks' },
      { id: 'requisicoes', labelKey: 'navSub.requisicoes', path: '/stocks?tab=requisicoes' },
      { id: 'descartes', labelKey: 'navSub.descartes', path: '/stocks?tab=descartes' },
    ],
  },
  {
    path: '/listagens',
    labelKey: 'nav.listings',
    icon: FileText,
    end: false,
    module: 'listagens' as PermissionModule,
    defaultSubItemId: 'painel_bordo',
    subItems: LISTING_ORDER.map((key) => ({
      id: key as MenuSubItemId,
      labelKey: `listings.${key}`,
      path: key === 'painel_bordo' ? '/listagens' : `/listagens?tab=${key}`,
    })),
  },
  {
    path: '/definicoes',
    labelKey: 'nav.admin',
    icon: Settings,
    end: false,
    module: 'definicoes' as PermissionModule,
    defaultSubItemId: 'utilizadores',
    subItems: [
      { id: 'utilizadores', labelKey: 'navSub.utilizadores', path: '/definicoes' },
      { id: 'permissoes', labelKey: 'navSub.permissoes', path: '/definicoes?tab=permissoes' },
      { id: 'empresas', labelKey: 'navSub.empresas', path: '/definicoes?tab=empresas' },
      { id: 'testes', labelKey: 'navSub.testes', path: '/definicoes?tab=testes' },
      { id: 'tipos_kit', labelKey: 'navSub.tipos_kit', path: '/definicoes?tab=tipos_kit' },
      { id: 'entidades', labelKey: 'navSub.entidades', path: '/definicoes?tab=entidades' },
      { id: 'laboratorios', labelKey: 'navSub.laboratorios', path: '/definicoes?tab=laboratorios' },
      { id: 'medicos', labelKey: 'navSub.medicos', path: '/definicoes?tab=medicos' },
      { id: 'motivos_anulacao', labelKey: 'navSub.motivos_anulacao', path: '/definicoes?tab=motivos_anulacao' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, hasPermission, hasStockSubmodulePermission, hasListingsSubmodulePermission, hasDefinicoesSubmodulePermission, currentUser } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const menuItems = useMemo(
    () => menuItemDefs.map((item) => ({
      ...item,
      label: t(item.labelKey),
      subItems: item.subItems?.map((sub) => ({
        ...sub,
        label: t(sub.labelKey),
      })),
    })),
    [t],
  );

  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.module, 'read'));
  const tabFromUrl = new URLSearchParams(location.search).get('tab') as MenuSubItemId | null;

  const getVisibleSubItems = (item: (typeof menuItems)[number]) => {
    if (!item.subItems) return [];

    if (item.module === 'stocks') {
      return item.subItems.filter((subItem) => hasStockSubmodulePermission(subItem.id as StockSubmodule));
    }

    if (item.module === 'listagens') {
      return item.subItems.filter((subItem) => hasListingsSubmodulePermission(subItem.id as ListingsSubmodule));
    }

    if (item.module === 'definicoes') {
      return item.subItems.filter((subItem) => hasDefinicoesSubmodulePermission(subItem.id as DefinicoesSubmodule));
    }

    return item.subItems;
  };

  const displayName = currentUser
    ? formatUtilizadorNome({ nome: currentUser.nome, medico_titulo: currentUser.medico_titulo })
    : t('common.currentUser');
  const displayRole = currentUser?.perfil_nome || t(`roles.${role}`);

  return (
    <aside
      className={`
        w-64 lg:w-60 h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col flex-shrink-0
        border-r border-slate-200 dark:border-slate-800
        fixed lg:relative inset-y-0 left-0 z-30
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GenomaLogo className="h-8 w-auto" />
        </div>
        {/* Close button - mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={t('nav.closeMenu')}
          title={t('nav.closeMenu')}
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-slate-400 dark:text-slate-500" style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 10px', fontWeight: 700 }}>
          {t('common.menu')}
        </div>
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isCurrentRoute =
            item.path === '/definicoes'
              ? location.pathname === '/definicoes' || location.pathname.startsWith('/definicoes/')
              : location.pathname === item.path;
          const visibleSubItems = getVisibleSubItems(item);
          const hasSubItems = visibleSubItems.length > 0;
          const shouldShowSubItems = hasSubItems && isCurrentRoute;
          const defaultVisibleSubItemId = visibleSubItems[0]?.id;
          return (
            <div key={item.path} className={hasSubItems ? 'group/nav-item' : ''}>
              <NavLink
                to={item.path}
                end={item.end}
                onClick={onClose}
                className="block rounded-xl transition-colors duration-150"
              >
                {({ isActive }) => (
                  <div
                    className={`relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-slate-900 dark:bg-slate-100" />
                    )}
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                          isActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-500'
                        }`}
                      />
                      <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                    </div>
                    {hasSubItems && (
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          shouldShowSubItems
                            ? 'rotate-180 text-white/80 dark:text-slate-700'
                            : isActive
                              ? 'text-white/80 dark:text-slate-700'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                    )}
                  </div>
                )}
              </NavLink>

              {hasSubItems && (
                <div
                  className={`overflow-hidden transition-all duration-200 pl-4 pr-2 ${
                    shouldShowSubItems
                      ? 'max-h-[28rem] opacity-100 mt-1'
                      : 'max-h-0 opacity-0 mt-0 pointer-events-none group-hover/nav-item:max-h-[28rem] group-hover/nav-item:opacity-100 group-hover/nav-item:mt-1 group-hover/nav-item:pointer-events-auto group-focus-within/nav-item:max-h-[28rem] group-focus-within/nav-item:opacity-100 group-focus-within/nav-item:mt-1 group-focus-within/nav-item:pointer-events-auto'
                  }`}
                >
                  <ul className="space-y-0.5 pb-1 max-h-[27rem] overflow-y-auto">
                    {visibleSubItems.map((subItem) => {
                      const activeSubItemId =
                        tabFromUrl ??
                        (location.pathname.startsWith('/definicoes/medicos') ? 'medicos' : null) ??
                        (location.pathname.startsWith('/definicoes/laboratorios') ? 'laboratorios' : null) ??
                        (location.pathname.startsWith('/definicoes/entidades') ? 'entidades' : null) ??
                        item.defaultSubItemId ??
                        defaultVisibleSubItemId;
                      const isSubItemActive = isCurrentRoute && activeSubItemId === subItem.id;
                      return (
                        <li key={subItem.id}>
                          <NavLink
                            to={subItem.path}
                            onClick={onClose}
                            className={`relative block rounded-lg py-1.5 pl-5 pr-2 transition-colors ${
                              isSubItemActive
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                            style={{ fontSize: '12px', fontWeight: isSubItemActive ? 600 : 500 }}
                          >
                            <span className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
                            <span className="absolute left-1.5 top-1/2 h-px w-3 -translate-y-1/2 bg-slate-300 dark:bg-slate-700" />
                            <span className={`absolute left-3.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${
                              isSubItemActive ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-300 dark:bg-slate-700'
                            }`} />
                            <span className="ml-[6px]">{subItem.label}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200/80 dark:border-slate-800">
        <div className="px-4 py-3">
          <UserAccountMenu placement="top-start" onMenuAction={onClose} trigger={({ onClick }) => (
            <button
              type="button"
              onClick={onClick}
              className="w-full flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left"
            >
              <UserAvatar
                name={displayName}
                avatarUrl={currentUser?.avatar_url}
                fallback={role.slice(0, 2).toUpperCase()}
              />
              <div className="min-w-0 flex-1">
                <div className="text-slate-900 dark:text-slate-100 truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{displayName}</div>
                <div className="text-slate-500 dark:text-slate-400 truncate" style={{ fontSize: '12px' }}>{displayRole}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            </button>
          )} />
        </div>
        <div className="border-t border-slate-200/80 dark:border-slate-800" />
        <div className="px-4 py-3 text-slate-400 dark:text-slate-500" style={{ fontSize: '11px' }}>© 2026 Genoma v2.0</div>
      </div>
    </aside>
  );
}
