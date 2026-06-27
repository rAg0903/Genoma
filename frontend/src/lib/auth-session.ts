export const AUTH_TOKEN_KEYS = ['token', 'authToken', 'jwtToken', 'access_token'] as const;

export const AUTH_SESSION_STORAGE_KEYS = [
  'genoma_user_role',
  'genoma_role_permissions',
  'genoma_stock_submodule_permissions',
  'genoma_listings_submodule_permissions',
  'genoma_definicoes_submodule_permissions',
  'genoma_perfil_permissions_by_id',
] as const;

export const AUTH_CHANGED_EVENT = 'genoma:auth-changed';

export function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  for (const key of AUTH_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return undefined;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  for (const key of AUTH_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
  for (const key of AUTH_SESSION_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export function notifyAuthChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
