import {
  createEmptyListingsNavPermissions,
  migrateListingsSubmodulePermissions,
} from './listings-nav';
import {
  cloneDefinicoesSubmodulePermissions,
  cloneListingsSubmodulePermissions,
  cloneStockSubmodulePermissions,
  DefinicoesSubmodulePermissions,
  ListingsSubmodulePermissions,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  PermissionAction,
  PermissionModule,
  ROLE_DEFINICOES_SUBMODULE_PERMISSIONS,
  ROLE_LISTINGS_SUBMODULE_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_STOCK_SUBMODULE_PERMISSIONS,
  RolePermissions,
  StockSubmodulePermissions,
  UserRole,
} from './permissions';

export type PerfilPermissionBundle = {
  modules: RolePermissions;
  stock: StockSubmodulePermissions;
  listings: ListingsSubmodulePermissions;
  definicoes: DefinicoesSubmodulePermissions;
};

export const PERFIL_PERMISSIONS_BY_ID_KEY = 'genoma_perfil_permissions_by_id';

const noActions = { read: false, create: false, update: false, delete: false };
const readOnly = { read: true, create: false, update: false, delete: false };
const allActions = { read: true, create: true, update: true, delete: true };

const noStock = { lotes: false, requisicoes: false, descartes: false };
const noListings = createEmptyListingsNavPermissions();
const noDefinicoes = {
  utilizadores: false,
  permissoes: false,
  empresas: false,
  testes: false,
  tipos_kit: false,
  entidades: false,
  laboratorios: false,
  medicos: false,
  motivos_anulacao: false,
};

export const createAdminPermissionBundle = (): PerfilPermissionBundle => ({
  modules: JSON.parse(JSON.stringify(ROLE_PERMISSIONS.Administrador)) as RolePermissions,
  stock: { ...ROLE_STOCK_SUBMODULE_PERMISSIONS.Administrador },
  listings: { ...ROLE_LISTINGS_SUBMODULE_PERMISSIONS.Administrador },
  definicoes: { ...ROLE_DEFINICOES_SUBMODULE_PERMISSIONS.Administrador },
});

export const createNewProfilePermissionBundle = (): PerfilPermissionBundle => ({
  modules: {
    dashboard: { ...readOnly },
    contactos: { ...noActions },
    processos: { ...noActions },
    stocks: { ...noActions },
    listagens: { ...noActions },
    definicoes: { ...noActions },
  },
  stock: { ...noStock },
  listings: { ...noListings },
  definicoes: { ...noDefinicoes },
});

export const createBundleFromLegacyRole = (role: UserRole): PerfilPermissionBundle => ({
  modules: { ...ROLE_PERMISSIONS[role] },
  stock: { ...ROLE_STOCK_SUBMODULE_PERMISSIONS[role] },
  listings: { ...ROLE_LISTINGS_SUBMODULE_PERMISSIONS[role] },
  definicoes: { ...ROLE_DEFINICOES_SUBMODULE_PERMISSIONS[role] },
});

export const clonePermissionBundle = (bundle: PerfilPermissionBundle): PerfilPermissionBundle =>
  JSON.parse(JSON.stringify(bundle)) as PerfilPermissionBundle;

export const normalizePermissionBundle = (bundle: PerfilPermissionBundle): PerfilPermissionBundle => {
  const next = clonePermissionBundle(bundle);
  next.listings = migrateListingsSubmodulePermissions(bundle.listings as Record<string, boolean>);
  return next;
};

export const readStoredPerfilPermissions = (): Record<string, PerfilPermissionBundle> => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(PERFIL_PERMISSIONS_BY_ID_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, PerfilPermissionBundle>;
    if (!parsed || typeof parsed !== 'object') return {};
    const result: Record<string, PerfilPermissionBundle> = {};
    for (const [id, bundle] of Object.entries(parsed)) {
      if (isValidPermissionBundle(bundle)) {
        result[id] = normalizePermissionBundle(bundle);
      }
    }
    return result;
  } catch {
    return {};
  }
};

export const persistPerfilPermissions = (data: Record<string, PerfilPermissionBundle>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PERFIL_PERMISSIONS_BY_ID_KEY, JSON.stringify(data));
};

export const getLegacyRoleFromPerfilNome = (perfilNome: string): UserRole | null => {
  const normalized = perfilNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (normalized === 'administrador') return 'Administrador';
  if (normalized === 'medico') return 'Medico';
  if (normalized === 'assistente') return 'Assistente';
  return null;
};

export const applyModulePermissionChange = (
  bundle: PerfilPermissionBundle,
  module: PermissionModule,
  action: PermissionAction,
  value: boolean,
): PerfilPermissionBundle => {
  const next = clonePermissionBundle(bundle);
  next.modules[module][action] = value;

  if (action === 'read' && !value) {
    next.modules[module].create = false;
    next.modules[module].update = false;
    next.modules[module].delete = false;
  }

  if (module === 'stocks' && action === 'read' && !value) {
    for (const key of Object.keys(next.stock) as Array<keyof StockSubmodulePermissions>) {
      next.stock[key] = false;
    }
  }

  if (module === 'listagens' && action === 'read' && !value) {
    for (const key of Object.keys(next.listings) as Array<keyof ListingsSubmodulePermissions>) {
      next.listings[key] = false;
    }
  }

  if (module === 'definicoes' && action === 'read' && !value) {
    for (const key of Object.keys(next.definicoes) as Array<keyof DefinicoesSubmodulePermissions>) {
      next.definicoes[key] = false;
    }
  }

  return next;
};

export const isValidPermissionBundle = (value: unknown): value is PerfilPermissionBundle => {
  if (!value || typeof value !== 'object') return false;
  const bundle = value as PerfilPermissionBundle;
  if (!bundle.modules || !bundle.stock || !bundle.listings || !bundle.definicoes) return false;
  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      if (typeof bundle.modules[module]?.[action] !== 'boolean') return false;
    }
  }
  return true;
};
