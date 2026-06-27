import {
  createEmptyListingsNavPermissions,
  createFullListingsNavPermissions,
  LISTINGS_NAV_ORDER,
  ListingsNavKey,
} from './listings-nav';

export type UserRole = 'Administrador' | 'Medico' | 'Assistente';
export type PermissionAction = 'read' | 'create' | 'update' | 'delete';
export type PermissionModule = 'dashboard' | 'contactos' | 'processos' | 'stocks' | 'listagens' | 'definicoes';
export type StockSubmodule = 'lotes' | 'requisicoes' | 'descartes';
export type ListingsSubmodule = ListingsNavKey;
export type DefinicoesSubmodule = 'utilizadores' | 'permissoes' | 'empresas' | 'testes' | 'tipos_kit' | 'entidades' | 'laboratorios' | 'medicos' | 'motivos_anulacao';

export type RolePermissions = Record<PermissionModule, Record<PermissionAction, boolean>>;
export type StockSubmodulePermissions = Record<StockSubmodule, boolean>;
export type ListingsSubmodulePermissions = Record<ListingsSubmodule, boolean>;
export type DefinicoesSubmodulePermissions = Record<DefinicoesSubmodule, boolean>;

export const USER_ROLES: UserRole[] = ['Administrador', 'Medico', 'Assistente'];
export const PERMISSION_MODULES: PermissionModule[] = ['dashboard', 'contactos', 'processos', 'stocks', 'listagens', 'definicoes'];
export const PERMISSION_ACTIONS: PermissionAction[] = ['read', 'create', 'update', 'delete'];
export const STOCK_SUBMODULES: StockSubmodule[] = ['lotes', 'requisicoes', 'descartes'];
export const LISTINGS_SUBMODULES: ListingsSubmodule[] = [...LISTINGS_NAV_ORDER];
export const DEFINICOES_SUBMODULES: DefinicoesSubmodule[] = ['utilizadores', 'permissoes', 'empresas', 'testes', 'tipos_kit', 'entidades', 'laboratorios', 'medicos', 'motivos_anulacao'];

const allActions = {
  read: true,
  create: true,
  update: true,
  delete: true,
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Administrador: {
    dashboard: { ...allActions },
    contactos: { ...allActions },
    processos: { ...allActions },
    stocks: { ...allActions },
    listagens: { ...allActions },
    definicoes: { ...allActions },
  },
  Medico: {
    dashboard: { read: true, create: false, update: false, delete: false },
    contactos: { read: true, create: true, update: true, delete: false },
    processos: { read: true, create: true, update: true, delete: false },
    stocks: { read: false, create: false, update: false, delete: false },
    listagens: { read: false, create: false, update: false, delete: false },
    definicoes: { read: false, create: false, update: false, delete: false },
  },
  Assistente: {
    dashboard: { read: true, create: false, update: false, delete: false },
    contactos: { read: true, create: true, update: true, delete: false },
    processos: { read: true, create: true, update: true, delete: false },
    stocks: { read: true, create: true, update: true, delete: false },
    listagens: { read: true, create: false, update: false, delete: false },
    definicoes: { read: false, create: false, update: false, delete: false },
  },
};

const allStockSubmodules = {
  lotes: true,
  requisicoes: true,
  descartes: true,
};

const noStockSubmodules = {
  lotes: false,
  requisicoes: false,
  descartes: false,
};

const allListingsSubmodules = createFullListingsNavPermissions();

const noListingsSubmodules = createEmptyListingsNavPermissions();

const allDefinicoesSubmodules = {
  utilizadores: true,
  permissoes: true,
  empresas: true,
  testes: true,
  tipos_kit: true,
  entidades: true,
  laboratorios: true,
  medicos: true,
  motivos_anulacao: true,
};

export const ROLE_STOCK_SUBMODULE_PERMISSIONS: Record<UserRole, StockSubmodulePermissions> = {
  Administrador: {
    ...allStockSubmodules,
  },
  Medico: {
    ...noStockSubmodules,
  },
  Assistente: {
    ...allStockSubmodules,
  },
};

export const ROLE_LISTINGS_SUBMODULE_PERMISSIONS: Record<UserRole, ListingsSubmodulePermissions> = {
  Administrador: {
    ...allListingsSubmodules,
  },
  Medico: {
    ...noListingsSubmodules,
  },
  Assistente: {
    ...allListingsSubmodules,
  },
};

export const ROLE_DEFINICOES_SUBMODULE_PERMISSIONS: Record<UserRole, DefinicoesSubmodulePermissions> = {
  Administrador: {
    ...allDefinicoesSubmodules,
  },
  Medico: {
    ...allDefinicoesSubmodules,
  },
  Assistente: {
    ...allDefinicoesSubmodules,
  },
};

export function cloneRolePermissions(source: Record<UserRole, RolePermissions>): Record<UserRole, RolePermissions> {
  return JSON.parse(JSON.stringify(source));
}

export function cloneStockSubmodulePermissions(source: Record<UserRole, StockSubmodulePermissions>): Record<UserRole, StockSubmodulePermissions> {
  return JSON.parse(JSON.stringify(source));
}

export function cloneListingsSubmodulePermissions(source: Record<UserRole, ListingsSubmodulePermissions>): Record<UserRole, ListingsSubmodulePermissions> {
  return JSON.parse(JSON.stringify(source));
}

export function cloneDefinicoesSubmodulePermissions(source: Record<UserRole, DefinicoesSubmodulePermissions>): Record<UserRole, DefinicoesSubmodulePermissions> {
  return JSON.parse(JSON.stringify(source));
}
