/** Chaves de sessão — manter alinhado com frontend/src/lib/auth-session.ts */
const AUTH_TOKEN_KEYS = ['token', 'authToken', 'jwtToken', 'access_token'];

const AUTH_SESSION_STORAGE_KEYS = [
  'genoma_user_role',
  'genoma_role_permissions',
  'genoma_stock_submodule_permissions',
  'genoma_listings_submodule_permissions',
  'genoma_definicoes_submodule_permissions',
  'genoma_perfil_permissions_by_id',
];

const DESKTOP_UA_TAG = 'GenomaDesktop/1.0';

function getClearAuthScript() {
  const keys = [...AUTH_TOKEN_KEYS, ...AUTH_SESSION_STORAGE_KEYS];
  return `(function(){try{var keys=${JSON.stringify(keys)};for(var i=0;i<keys.length;i++){localStorage.removeItem(keys[i]);sessionStorage.removeItem(keys[i]);}}catch(e){}})();`;
}

module.exports = {
  AUTH_TOKEN_KEYS,
  AUTH_SESSION_STORAGE_KEYS,
  DESKTOP_UA_TAG,
  getClearAuthScript,
};
