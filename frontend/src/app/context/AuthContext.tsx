import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { AUTH_CHANGED_EVENT, clearAuthSession, getAuthToken, notifyAuthChanged } from '../../lib/auth-session';
import { perfisApi } from '../../lib/api-perfis';
import {
  applyModulePermissionChange,
  clonePermissionBundle,
  createAdminPermissionBundle,
  createBundleFromLegacyRole,
  createNewProfilePermissionBundle,
  getLegacyRoleFromPerfilNome,
  isValidPermissionBundle,
  PerfilPermissionBundle,
  normalizePermissionBundle,
  persistPerfilPermissions,
  readStoredPerfilPermissions,
} from '../../lib/perfil-permissions';
import { migrateListingsSubmodulePermissions } from '../../lib/listings-nav';
import { isAdminPerfilNome } from '../../lib/perfil-utils';
import {
  cloneDefinicoesSubmodulePermissions,
  cloneListingsSubmodulePermissions,
  cloneStockSubmodulePermissions,
  cloneRolePermissions,
  DEFINICOES_SUBMODULES,
  DefinicoesSubmodule,
  DefinicoesSubmodulePermissions,
  LISTINGS_SUBMODULES,
  ListingsSubmodule,
  ListingsSubmodulePermissions,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  PermissionAction,
  PermissionModule,
  ROLE_DEFINICOES_SUBMODULE_PERMISSIONS,
  ROLE_LISTINGS_SUBMODULE_PERMISSIONS,
  ROLE_STOCK_SUBMODULE_PERMISSIONS,
  ROLE_PERMISSIONS,
  RolePermissions,
  StockSubmodule,
  StockSubmodulePermissions,
  STOCK_SUBMODULES,
  UserRole,
  USER_ROLES,
} from '../../lib/permissions';

type AuthSessionStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthContextType = {
  role: UserRole;
  currentUser: CurrentUser | null;
  currentPerfilId: string | null;
  isAdministrator: boolean;
  isSessionReady: boolean;
  sessionStatus: AuthSessionStatus;
  rolePermissions: Record<UserRole, RolePermissions>;
  stockSubmodulePermissions: Record<UserRole, StockSubmodulePermissions>;
  listingsSubmodulePermissions: Record<UserRole, ListingsSubmodulePermissions>;
  definicoesSubmodulePermissions: Record<UserRole, DefinicoesSubmodulePermissions>;
  stockPermissionsSyncStatus: 'idle' | 'syncing' | 'synced' | 'fallback';
  setRole: (role: UserRole) => void;
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  hasStockSubmodulePermission: (submodule: StockSubmodule) => boolean;
  hasListingsSubmodulePermission: (submodule: ListingsSubmodule) => boolean;
  hasDefinicoesSubmodulePermission: (submodule: DefinicoesSubmodule) => boolean;
  refreshStockPermissionsFromBackend: () => Promise<void>;
  updateRolePermission: (targetRole: UserRole, module: PermissionModule, action: PermissionAction, value: boolean) => void;
  updateStockSubmodulePermission: (targetRole: UserRole, submodule: StockSubmodule, value: boolean) => void;
  updateListingsSubmodulePermission: (targetRole: UserRole, submodule: ListingsSubmodule, value: boolean) => void;
  updateDefinicoesSubmodulePermission: (targetRole: UserRole, submodule: DefinicoesSubmodule, value: boolean) => void;
  resetRolePermissions: () => void;
  getPerfilPermissionBundle: (perfilId: string) => PerfilPermissionBundle;
  initPermissionsForPerfil: (perfilId: string) => void;
  removePermissionsForPerfil: (perfilId: string) => void;
  updatePerfilModulePermission: (perfilId: string, module: PermissionModule, action: PermissionAction, value: boolean) => void;
  updatePerfilStockSubmodulePermission: (perfilId: string, submodule: StockSubmodule, value: boolean) => void;
  updatePerfilListingsSubmodulePermission: (perfilId: string, submodule: ListingsSubmodule, value: boolean) => void;
  updatePerfilDefinicoesSubmodulePermission: (perfilId: string, submodule: DefinicoesSubmodule, value: boolean) => void;
  updateProfile: (data: { nome: string; email: string; avatar_url?: string | null }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'genoma_user_role';
const PERMISSIONS_STORAGE_KEY = 'genoma_role_permissions';
const STOCK_SUBMODULE_PERMISSIONS_STORAGE_KEY = 'genoma_stock_submodule_permissions';
const LISTINGS_SUBMODULE_PERMISSIONS_STORAGE_KEY = 'genoma_listings_submodule_permissions';
const DEFINICOES_SUBMODULE_PERMISSIONS_STORAGE_KEY = 'genoma_definicoes_submodule_permissions';

const readStoredRole = (): UserRole => {
  if (typeof window === 'undefined') return 'Assistente';
  const value = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
  if (!value) return 'Assistente';
  return value in ROLE_PERMISSIONS ? value : 'Assistente';
};

type ApiPerfil = {
  id: string;
  nome: string;
};

type ApiPerfisResponse = {
  data?: ApiPerfil[];
};

type ApiPerfilResponse = {
  id: string;
  nome: string;
};

type CurrentUser = {
  id: string;
  nome: string;
  email: string;
  ativo?: boolean;
  perfil_nome?: string | null;
  avatar_url?: string | null;
  medico_titulo?: string | null;
};

type ApiCurrentUserResponse = {
  id: string;
  nome: string;
  email: string;
  ativo?: boolean;
  perfil_nome?: string | null;
  avatar_url?: string | null;
  medico_titulo?: string | null;
};

type ApiStockSubmoduleResponse = {
  data?: {
    perfil_id?: string;
    permissoes?: Partial<Record<StockSubmodule, boolean>>;
  };
};

const createDefaultPermissions = () => cloneRolePermissions(ROLE_PERMISSIONS);
const createDefaultStockSubmodulePermissions = () => cloneStockSubmodulePermissions(ROLE_STOCK_SUBMODULE_PERMISSIONS);
const createDefaultListingsSubmodulePermissions = () => cloneListingsSubmodulePermissions(ROLE_LISTINGS_SUBMODULE_PERMISSIONS);
const createDefaultDefinicoesSubmodulePermissions = () => cloneDefinicoesSubmodulePermissions(ROLE_DEFINICOES_SUBMODULE_PERMISSIONS);

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

  try {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getPerfilIdFromToken = (token: string): string | null => {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const value = payload.role ?? payload.perfil_id;
  return typeof value === 'string' ? value : null;
};

const getUserIdFromToken = (token: string): string | null => {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const value = payload.id;
  return typeof value === 'string' ? value : null;
};

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getRoleByPerfilNome = (perfilNome: string): UserRole | null => {
  const normalized = normalizeName(perfilNome);
  if (normalized === 'administrador') return 'Administrador';
  if (normalized === 'medico') return 'Medico';
  if (normalized === 'assistente') return 'Assistente';
  return null;
};

const normalizeStoredPermissions = (parsed: unknown): Record<UserRole, RolePermissions> => {
  const normalized = createDefaultPermissions();
  if (!parsed || typeof parsed !== 'object') return normalized;

  const parsedRecord = parsed as Record<string, unknown>;
  for (const role of USER_ROLES) {
    if (role === 'Administrador') continue;

    const roleData = parsedRecord[role];
    if (!roleData || typeof roleData !== 'object') continue;

    const roleRecord = roleData as Record<string, unknown>;
    for (const module of PERMISSION_MODULES) {
      const moduleData = roleRecord[module];
      if (!moduleData || typeof moduleData !== 'object') continue;

      const moduleRecord = moduleData as Record<string, unknown>;
      for (const action of PERMISSION_ACTIONS) {
        if (typeof moduleRecord[action] === 'boolean') {
          normalized[role][module][action] = moduleRecord[action] as boolean;
        }
      }
    }
  }

  return normalized;
};

const readStoredPermissions = (): Record<UserRole, RolePermissions> => {
  if (typeof window === 'undefined') return createDefaultPermissions();

  const raw = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
  if (!raw) return createDefaultPermissions();

  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredPermissions(parsed);
  } catch {
    return createDefaultPermissions();
  }
};

const normalizeStoredStockSubmodulePermissions = (parsed: unknown): Record<UserRole, StockSubmodulePermissions> => {
  const normalized = createDefaultStockSubmodulePermissions();
  if (!parsed || typeof parsed !== 'object') return normalized;

  const parsedRecord = parsed as Record<string, unknown>;
  for (const role of USER_ROLES) {
    if (role === 'Administrador') continue;

    const roleData = parsedRecord[role];
    if (!roleData || typeof roleData !== 'object') continue;

    const roleRecord = roleData as Record<string, unknown>;
    for (const submodule of STOCK_SUBMODULES) {
      if (typeof roleRecord[submodule] === 'boolean') {
        normalized[role][submodule] = roleRecord[submodule] as boolean;
      }
    }
  }

  return normalized;
};

const readStoredStockSubmodulePermissions = (): Record<UserRole, StockSubmodulePermissions> => {
  if (typeof window === 'undefined') return createDefaultStockSubmodulePermissions();

  const raw = window.localStorage.getItem(STOCK_SUBMODULE_PERMISSIONS_STORAGE_KEY);
  if (!raw) return createDefaultStockSubmodulePermissions();

  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredStockSubmodulePermissions(parsed);
  } catch {
    return createDefaultStockSubmodulePermissions();
  }
};

const normalizeStoredListingsSubmodulePermissions = (parsed: unknown): Record<UserRole, ListingsSubmodulePermissions> => {
  const normalized = createDefaultListingsSubmodulePermissions();
  if (!parsed || typeof parsed !== 'object') return normalized;

  const parsedRecord = parsed as Record<string, unknown>;
  for (const role of USER_ROLES) {
    if (role === 'Administrador') continue;

    const roleData = parsedRecord[role];
    if (!roleData || typeof roleData !== 'object') continue;

    normalized[role] = migrateListingsSubmodulePermissions(roleData as Record<string, boolean>);
  }

  return normalized;
};

const readStoredListingsSubmodulePermissions = (): Record<UserRole, ListingsSubmodulePermissions> => {
  if (typeof window === 'undefined') return createDefaultListingsSubmodulePermissions();

  const raw = window.localStorage.getItem(LISTINGS_SUBMODULE_PERMISSIONS_STORAGE_KEY);
  if (!raw) return createDefaultListingsSubmodulePermissions();

  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredListingsSubmodulePermissions(parsed);
  } catch {
    return createDefaultListingsSubmodulePermissions();
  }
};

const normalizeStoredDefinicoesSubmodulePermissions = (parsed: unknown): Record<UserRole, DefinicoesSubmodulePermissions> => {
  const normalized = createDefaultDefinicoesSubmodulePermissions();
  if (!parsed || typeof parsed !== 'object') return normalized;

  const parsedRecord = parsed as Record<string, unknown>;
  for (const role of USER_ROLES) {
    if (role === 'Administrador') continue;

    const roleData = parsedRecord[role];
    if (!roleData || typeof roleData !== 'object') continue;

    const roleRecord = roleData as Record<string, unknown>;
    for (const submodule of DEFINICOES_SUBMODULES) {
      if (typeof roleRecord[submodule] === 'boolean') {
        normalized[role][submodule] = roleRecord[submodule] as boolean;
      }
    }
  }

  return normalized;
};

const readStoredDefinicoesSubmodulePermissions = (): Record<UserRole, DefinicoesSubmodulePermissions> => {
  if (typeof window === 'undefined') return createDefaultDefinicoesSubmodulePermissions();

  const raw = window.localStorage.getItem(DEFINICOES_SUBMODULE_PERMISSIONS_STORAGE_KEY);
  if (!raw) return createDefaultDefinicoesSubmodulePermissions();

  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredDefinicoesSubmodulePermissions(parsed);
  } catch {
    return createDefaultDefinicoesSubmodulePermissions();
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('Assistente');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => createDefaultPermissions());
  const [stockSubmodulePermissions, setStockSubmodulePermissions] = useState<Record<UserRole, StockSubmodulePermissions>>(() => createDefaultStockSubmodulePermissions());
  const [listingsSubmodulePermissions, setListingsSubmodulePermissions] = useState<Record<UserRole, ListingsSubmodulePermissions>>(() => createDefaultListingsSubmodulePermissions());
  const [definicoesSubmodulePermissions, setDefinicoesSubmodulePermissions] = useState<Record<UserRole, DefinicoesSubmodulePermissions>>(() => createDefaultDefinicoesSubmodulePermissions());
  const [perfilIdsByRole, setPerfilIdsByRole] = useState<Partial<Record<UserRole, string>>>({});
  const [currentPerfilId, setCurrentPerfilId] = useState<string | null>(null);
  const [permissionsByPerfilId, setPermissionsByPerfilId] = useState<Record<string, PerfilPermissionBundle>>({});
  const [stockPermissionsSyncStatus, setStockPermissionsSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'fallback'>('idle');
  const [sessionStatus, setSessionStatus] = useState<AuthSessionStatus>(() => (
    getAuthToken() ? 'checking' : 'unauthenticated'
  ));
  const lastKnownTokenRef = useRef<string | undefined>(getAuthToken());

  const isSessionReady = sessionStatus !== 'checking';
  const isAdministrator = sessionStatus === 'authenticated'
    && (isAdminPerfilNome(currentUser?.perfil_nome) || role === 'Administrador');

  const persistPermissionsByPerfilId = (next: Record<string, PerfilPermissionBundle>) => {
    setPermissionsByPerfilId(next);
    persistPerfilPermissions(next);
  };

  const buildBundleForPerfil = useCallback((perfilId: string, perfilNome: string, stored: Record<string, PerfilPermissionBundle>): PerfilPermissionBundle => {
    if (isAdminPerfilNome(perfilNome)) {
      return createAdminPermissionBundle();
    }
    if (stored[perfilId] && isValidPermissionBundle(stored[perfilId])) {
      return normalizePermissionBundle(stored[perfilId]);
    }
    const legacyRole = getLegacyRoleFromPerfilNome(perfilNome);
    if (legacyRole) {
      return createBundleFromLegacyRole(legacyRole);
    }
    return createNewProfilePermissionBundle();
  }, []);

  const getPerfilPermissionBundle = useCallback((perfilId: string): PerfilPermissionBundle => {
    const stored = permissionsByPerfilId[perfilId];
    if (stored && isValidPermissionBundle(stored)) {
      return normalizePermissionBundle(stored);
    }
    return createNewProfilePermissionBundle();
  }, [permissionsByPerfilId]);

  const initPermissionsForPerfil = useCallback((perfilId: string) => {
    setPermissionsByPerfilId((prev) => {
      if (prev[perfilId]) return prev;
      const next = { ...prev, [perfilId]: createNewProfilePermissionBundle() };
      persistPerfilPermissions(next);
      return next;
    });
  }, []);

  const removePermissionsForPerfil = useCallback((perfilId: string) => {
    setPermissionsByPerfilId((prev) => {
      if (!prev[perfilId]) return prev;
      const next = { ...prev };
      delete next[perfilId];
      persistPerfilPermissions(next);
      return next;
    });
  }, []);

  const updatePerfilBundle = useCallback((perfilId: string, updater: (bundle: PerfilPermissionBundle) => PerfilPermissionBundle) => {
    setPermissionsByPerfilId((prev) => {
      const current = prev[perfilId] && isValidPermissionBundle(prev[perfilId])
        ? clonePermissionBundle(prev[perfilId])
        : createNewProfilePermissionBundle();
      const next = { ...prev, [perfilId]: updater(current) };
      persistPerfilPermissions(next);
      return next;
    });
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newRole);
    }
  };

  const persistRolePermissions = (nextPermissions: Record<UserRole, RolePermissions>) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions));
    }
  };

  const persistStockSubmodulePermissions = (nextPermissions: Record<UserRole, StockSubmodulePermissions>) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STOCK_SUBMODULE_PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions));
    }
  };

  const persistListingsSubmodulePermissions = (nextPermissions: Record<UserRole, ListingsSubmodulePermissions>) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LISTINGS_SUBMODULE_PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions));
    }
  };

  const persistDefinicoesSubmodulePermissions = (nextPermissions: Record<UserRole, DefinicoesSubmodulePermissions>) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFINICOES_SUBMODULE_PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions));
    }
  };

  const resetSessionState = useCallback(() => {
    setRoleState('Assistente');
    setCurrentUser(null);
    setCurrentPerfilId(null);
    setPerfilIdsByRole({});
    setPermissionsByPerfilId({});
    setRolePermissions(createDefaultPermissions());
    setStockSubmodulePermissions(createDefaultStockSubmodulePermissions());
    setListingsSubmodulePermissions(createDefaultListingsSubmodulePermissions());
    setDefinicoesSubmodulePermissions(createDefaultDefinicoesSubmodulePermissions());
    setStockPermissionsSyncStatus('idle');
  }, []);

  const bootstrapSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      resetSessionState();
      setSessionStatus('unauthenticated');
      lastKnownTokenRef.current = undefined;
      return;
    }

    const tokenChanged = token !== lastKnownTokenRef.current;
    if (tokenChanged) {
      resetSessionState();
      lastKnownTokenRef.current = token;
    }

    setSessionStatus('checking');
    setStockPermissionsSyncStatus('syncing');

    try {
      const userId = getUserIdFromToken(token);
      if (userId) {
        try {
          const userResponse = await apiRequest<ApiCurrentUserResponse>(`/utilizadores/${userId}`, { token });
          setCurrentUser({
            id: userResponse.id,
            nome: userResponse.nome,
            email: userResponse.email,
            ativo: userResponse.ativo,
            perfil_nome: userResponse.perfil_nome ?? null,
            avatar_url: userResponse.avatar_url ?? null,
            medico_titulo: userResponse.medico_titulo ?? null,
          });
        } catch {
          setCurrentUser(null);
        }
      }

      const tokenPerfilId = getPerfilIdFromToken(token);
      let isCurrentUserAdmin = false;
      if (tokenPerfilId) {
        setCurrentPerfilId(tokenPerfilId);
        try {
          const perfilResponse = await apiRequest<ApiPerfilResponse>(`/perfis/${tokenPerfilId}`, { token });
          isCurrentUserAdmin = isAdminPerfilNome(perfilResponse.nome);
          const mappedRole = getRoleByPerfilNome(perfilResponse.nome);
          if (mappedRole) {
            setRoleState(mappedRole);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(STORAGE_KEY, mappedRole);
            }
          }
        } catch {
          // perfil desconhecido — mantém defaults restritivos
        }
      }

      const perfisResponse = await apiRequest<ApiPerfisResponse>('/perfis', { token });
      const perfis = perfisResponse.data || [];

      const nextPerfilIdsByRole: Partial<Record<UserRole, string>> = {};
      const nextPermissionsByPerfilId: Record<string, PerfilPermissionBundle> = {};

      for (const perfil of perfis) {
        const mappedRole = getRoleByPerfilNome(perfil.nome);
        if (mappedRole) {
          nextPerfilIdsByRole[mappedRole] = perfil.id;
        }

        let bundle = buildBundleForPerfil(perfil.id, perfil.nome, nextPermissionsByPerfilId);
        const shouldFetchStockSubmodulos =
          !isAdminPerfilNome(perfil.nome) && (isCurrentUserAdmin || perfil.id === tokenPerfilId);
        if (shouldFetchStockSubmodulos) {
          try {
            const stockResponse = await apiRequest<ApiStockSubmoduleResponse>(`/perfis/${perfil.id}/stocks-submodulos`, { token });
            const remote = stockResponse.data?.permissoes;
            if (remote) {
              for (const submodule of STOCK_SUBMODULES) {
                if (typeof remote[submodule] === 'boolean') {
                  bundle.stock[submodule] = remote[submodule] as boolean;
                }
              }
            }
          } catch {
            // mantém stock do bundle base
          }
        }
        nextPermissionsByPerfilId[perfil.id] = bundle;
      }

      setPerfilIdsByRole(nextPerfilIdsByRole);
      persistPermissionsByPerfilId(nextPermissionsByPerfilId);

      const nextRolePermissions = createDefaultPermissions();
      const nextListingsPermissions = createDefaultListingsSubmodulePermissions();
      const nextDefinicoesPermissions = createDefaultDefinicoesSubmodulePermissions();
      const nextStockPermissions = createDefaultStockSubmodulePermissions();

      for (const targetRole of USER_ROLES) {
        const perfilId = nextPerfilIdsByRole[targetRole];
        if (!perfilId) continue;
        const bundle = nextPermissionsByPerfilId[perfilId];
        if (!bundle) continue;
        nextRolePermissions[targetRole] = { ...bundle.modules };
        nextStockPermissions[targetRole] = { ...bundle.stock };
        nextListingsPermissions[targetRole] = { ...bundle.listings };
        nextDefinicoesPermissions[targetRole] = { ...bundle.definicoes };
      }

      setRolePermissions(nextRolePermissions);
      persistRolePermissions(nextRolePermissions);
      setStockSubmodulePermissions(nextStockPermissions);
      persistStockSubmodulePermissions(nextStockPermissions);
      setListingsSubmodulePermissions(nextListingsPermissions);
      persistListingsSubmodulePermissions(nextListingsPermissions);
      setDefinicoesSubmodulePermissions(nextDefinicoesPermissions);
      persistDefinicoesSubmodulePermissions(nextDefinicoesPermissions);
      setStockPermissionsSyncStatus('synced');
      setSessionStatus('authenticated');
    } catch {
      setStockPermissionsSyncStatus('fallback');
      setSessionStatus('authenticated');
    }
  }, [buildBundleForPerfil, resetSessionState]);

  const refreshStockPermissionsFromBackend = useCallback(async () => {
    await bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    const handleAuthChanged = () => { void bootstrapSession(); };
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    void bootstrapSession();
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, [bootstrapSession]);

  const logout = useCallback(() => {
    clearAuthSession();
    resetSessionState();
    lastKnownTokenRef.current = undefined;
    setSessionStatus('unauthenticated');
    notifyAuthChanged();
  }, [resetSessionState]);

  const updateRolePermission = (targetRole: UserRole, module: PermissionModule, action: PermissionAction, value: boolean) => {
    if (targetRole === 'Administrador') {
      return;
    }

    setRolePermissions((prev) => {
      const next = cloneRolePermissions(prev);
      next[targetRole][module][action] = value;
      persistRolePermissions(next);
      return next;
    });

    if (module === 'stocks' && action === 'read' && !value) {
      setStockSubmodulePermissions((prev) => {
        const next = cloneStockSubmodulePermissions(prev);
        for (const submodule of STOCK_SUBMODULES) {
          next[targetRole][submodule] = false;
        }
        persistStockSubmodulePermissions(next);
        return next;
      });
    }

    if (module === 'listagens' && action === 'read' && !value) {
      setListingsSubmodulePermissions((prev) => {
        const next = cloneListingsSubmodulePermissions(prev);
        for (const submodule of LISTINGS_SUBMODULES) {
          next[targetRole][submodule] = false;
        }
        persistListingsSubmodulePermissions(next);
        return next;
      });
    }

    if (module === 'definicoes' && action === 'read' && !value) {
      setDefinicoesSubmodulePermissions((prev) => {
        const next = cloneDefinicoesSubmodulePermissions(prev);
        for (const submodule of DEFINICOES_SUBMODULES) {
          next[targetRole][submodule] = false;
        }
        persistDefinicoesSubmodulePermissions(next);
        return next;
      });
    }
  };

  const updateStockSubmodulePermission = (targetRole: UserRole, submodule: StockSubmodule, value: boolean) => {
    if (targetRole === 'Administrador') {
      return;
    }

    setStockSubmodulePermissions((prev) => {
      const next = cloneStockSubmodulePermissions(prev);
      next[targetRole][submodule] = value;
      persistStockSubmodulePermissions(next);
      return next;
    });

    const token = getAuthToken();
    const perfilId = perfilIdsByRole[targetRole];
    if (!token || !perfilId) {
      return;
    }

    void apiRequest(`/perfis/${perfilId}/stocks-submodulos`, {
      method: 'PUT',
      token,
      body: { [submodule]: value },
    }).catch(() => {
      // Do not block UI on remote persistence failures.
    });
  };

  const updateListingsSubmodulePermission = (targetRole: UserRole, submodule: ListingsSubmodule, value: boolean) => {
    if (targetRole === 'Administrador') {
      return;
    }

    setListingsSubmodulePermissions((prev) => {
      const next = cloneListingsSubmodulePermissions(prev);
      next[targetRole][submodule] = value;
      persistListingsSubmodulePermissions(next);
      return next;
    });
  };

  const updateDefinicoesSubmodulePermission = (targetRole: UserRole, submodule: DefinicoesSubmodule, value: boolean) => {
    if (targetRole === 'Administrador') {
      return;
    }

    setDefinicoesSubmodulePermissions((prev) => {
      const next = cloneDefinicoesSubmodulePermissions(prev);
      next[targetRole][submodule] = value;
      persistDefinicoesSubmodulePermissions(next);
      return next;
    });
  };

  const resetRolePermissions = () => {
    const defaults = createDefaultPermissions();
    setRolePermissions(defaults);
    persistRolePermissions(defaults);

    const stockDefaults = createDefaultStockSubmodulePermissions();
    setStockSubmodulePermissions(stockDefaults);
    persistStockSubmodulePermissions(stockDefaults);

    const listingsDefaults = createDefaultListingsSubmodulePermissions();
    setListingsSubmodulePermissions(listingsDefaults);
    persistListingsSubmodulePermissions(listingsDefaults);

    const definicoesDefaults = createDefaultDefinicoesSubmodulePermissions();
    setDefinicoesSubmodulePermissions(definicoesDefaults);
    persistDefinicoesSubmodulePermissions(definicoesDefaults);

    const token = getAuthToken();
    if (!token) {
      return;
    }

    for (const targetRole of USER_ROLES) {
      if (targetRole === 'Administrador') continue;
      const perfilId = perfilIdsByRole[targetRole];
      if (!perfilId) continue;

      void apiRequest(`/perfis/${perfilId}/stocks-submodulos`, {
        method: 'PUT',
        token,
        body: stockDefaults[targetRole],
      }).catch(() => {
        // Ignore remote reset failures to keep local fallback behavior.
      });
    }
  };

  const activePermissionBundle = useMemo((): PerfilPermissionBundle | null => {
    if (isAdministrator) return createAdminPermissionBundle();
    if (currentPerfilId && permissionsByPerfilId[currentPerfilId] && isValidPermissionBundle(permissionsByPerfilId[currentPerfilId])) {
      return permissionsByPerfilId[currentPerfilId];
    }
    const legacyRole = role;
    return {
      modules: rolePermissions[legacyRole],
      stock: stockSubmodulePermissions[legacyRole],
      listings: listingsSubmodulePermissions[legacyRole],
      definicoes: definicoesSubmodulePermissions[legacyRole],
    };
  }, [currentPerfilId, definicoesSubmodulePermissions, isAdministrator, listingsSubmodulePermissions, permissionsByPerfilId, role, rolePermissions, stockSubmodulePermissions]);

  const hasPermission = (module: PermissionModule, action: PermissionAction) => {
    if (sessionStatus !== 'authenticated') return false;
    if (isAdministrator) return true;
    return activePermissionBundle?.modules[module][action] ?? false;
  };

  const hasStockSubmodulePermission = (submodule: StockSubmodule) => {
    return hasPermission('stocks', 'read') && (activePermissionBundle?.stock[submodule] ?? false);
  };

  const hasListingsSubmodulePermission = (submodule: ListingsSubmodule) => {
    return hasPermission('listagens', 'read') && (activePermissionBundle?.listings[submodule] ?? false);
  };

  const hasDefinicoesSubmodulePermission = (submodule: DefinicoesSubmodule) => {
    return hasPermission('definicoes', 'read') && (activePermissionBundle?.definicoes[submodule] ?? false);
  };

  const updatePerfilModulePermission = (perfilId: string, module: PermissionModule, action: PermissionAction, value: boolean) => {
    updatePerfilBundle(perfilId, (bundle) => applyModulePermissionChange(bundle, module, action, value));
  };

  const updatePerfilStockSubmodulePermission = (perfilId: string, submodule: StockSubmodule, value: boolean) => {
    updatePerfilBundle(perfilId, (bundle) => {
      const next = clonePermissionBundle(bundle);
      next.stock[submodule] = value;
      return next;
    });

    const token = getAuthToken();
    if (!token) return;
    void perfisApi.updateStockSubmodulos(perfilId, { [submodule]: value }).catch(() => undefined);
  };

  const updatePerfilListingsSubmodulePermission = (perfilId: string, submodule: ListingsSubmodule, value: boolean) => {
    updatePerfilBundle(perfilId, (bundle) => {
      const next = clonePermissionBundle(bundle);
      next.listings[submodule] = value;
      return next;
    });
  };

  const updatePerfilDefinicoesSubmodulePermission = (perfilId: string, submodule: DefinicoesSubmodule, value: boolean) => {
    updatePerfilBundle(perfilId, (bundle) => {
      const next = clonePermissionBundle(bundle);
      next.definicoes[submodule] = value;
      return next;
    });
  };

  const updateProfile = useCallback(async (data: { nome: string; email: string; avatar_url?: string | null }) => {
    const token = getAuthToken();
    if (!token || !currentUser?.id) {
      throw new Error('Sessão inválida. Inicie sessão novamente.');
    }

    const body: { nome: string; email: string; avatar_url?: string | null } = {
      nome: data.nome.trim(),
      email: data.email.trim(),
    };
    if (data.avatar_url !== undefined) {
      body.avatar_url = data.avatar_url;
    }

    const response = await apiRequest<{ message?: string; data?: Partial<ApiCurrentUserResponse> }>(
      `/utilizadores/${currentUser.id}`,
      {
        method: 'PUT',
        token,
        body,
      },
    );

    setCurrentUser((prev) => ({
      id: prev?.id || currentUser.id,
      nome: data.nome.trim(),
      email: data.email.trim(),
      ativo: response.data?.ativo ?? prev?.ativo,
      perfil_nome: response.data?.perfil_nome ?? prev?.perfil_nome ?? null,
      medico_titulo: response.data?.medico_titulo ?? prev?.medico_titulo ?? null,
      avatar_url: response.data?.avatar_url !== undefined
        ? (response.data.avatar_url ?? null)
        : (data.avatar_url !== undefined ? (data.avatar_url ?? null) : (prev?.avatar_url ?? null)),
    }));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('genoma:utilizadores-changed'));
    }
  }, [currentUser?.id]);

  const value = useMemo(
    () => ({
      role,
      currentUser,
      currentPerfilId,
      isAdministrator,
      isSessionReady,
      sessionStatus,
      rolePermissions,
      stockSubmodulePermissions,
      listingsSubmodulePermissions,
      definicoesSubmodulePermissions,
      stockPermissionsSyncStatus,
      setRole,
      hasPermission,
      hasStockSubmodulePermission,
      hasListingsSubmodulePermission,
      hasDefinicoesSubmodulePermission,
      refreshStockPermissionsFromBackend,
      updateRolePermission,
      updateStockSubmodulePermission,
      updateListingsSubmodulePermission,
      updateDefinicoesSubmodulePermission,
      resetRolePermissions,
      getPerfilPermissionBundle,
      initPermissionsForPerfil,
      removePermissionsForPerfil,
      updatePerfilModulePermission,
      updatePerfilStockSubmodulePermission,
      updatePerfilListingsSubmodulePermission,
      updatePerfilDefinicoesSubmodulePermission,
      updateProfile,
      logout,
    }),
    [
      role,
      currentUser,
      currentPerfilId,
      isAdministrator,
      isSessionReady,
      sessionStatus,
      rolePermissions,
      stockSubmodulePermissions,
      listingsSubmodulePermissions,
      definicoesSubmodulePermissions,
      stockPermissionsSyncStatus,
      refreshStockPermissionsFromBackend,
      getPerfilPermissionBundle,
      initPermissionsForPerfil,
      removePermissionsForPerfil,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
