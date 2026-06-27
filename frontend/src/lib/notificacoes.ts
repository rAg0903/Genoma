import type { NotificacaoCategoria } from './api-notificacoes';

/** Agrupamentos de filtro na página de notificações. */
export type NotificacaoFilterGroup =
  | 'todas'
  | 'nao_lidas'
  | 'processos'
  | 'contactos'
  | 'faturacao_contacto'
  | 'faturacao_processo'
  | 'stock'
  | 'lembretes';

/** Preferências de tipos de notificação (Definições → Notificações). */
export type NotifPrefKey =
  | 'processos'
  | 'contactos'
  | 'faturacao_contacto'
  | 'faturacao_processo'
  | 'stock'
  | 'lembretes'
  | 'email';

export type NotifPrefs = Record<NotifPrefKey, boolean>;

export const NOTIF_PREFS_KEY = 'genoma_notificacoes_prefs';

export const NOTIF_PREF_KEYS: NotifPrefKey[] = [
  'processos',
  'contactos',
  'faturacao_contacto',
  'faturacao_processo',
  'stock',
  'lembretes',
  'email',
];

export const defaultNotifPrefs: NotifPrefs = {
  processos: true,
  contactos: true,
  faturacao_contacto: true,
  faturacao_processo: true,
  stock: true,
  lembretes: true,
  email: true,
};

/** Chaves i18n em settings.notifications.* */
export const NOTIF_PREF_UI: { key: NotifPrefKey; labelKey: string; descKey: string }[] = [
  { key: 'processos', labelKey: 'settings.notifications.processos.label', descKey: 'settings.notifications.processos.desc' },
  { key: 'contactos', labelKey: 'settings.notifications.contactos.label', descKey: 'settings.notifications.contactos.desc' },
  { key: 'faturacao_contacto', labelKey: 'settings.notifications.faturacaoContacto.label', descKey: 'settings.notifications.faturacaoContacto.desc' },
  { key: 'faturacao_processo', labelKey: 'settings.notifications.faturacaoProcesso.label', descKey: 'settings.notifications.faturacaoProcesso.desc' },
  { key: 'stock', labelKey: 'settings.notifications.stock.label', descKey: 'settings.notifications.stock.desc' },
  { key: 'lembretes', labelKey: 'settings.notifications.lembretes.label', descKey: 'settings.notifications.lembretes.desc' },
  { key: 'email', labelKey: 'settings.notifications.email.label', descKey: 'settings.notifications.email.desc' },
];

export function readNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return { ...defaultNotifPrefs };
    const parsed = JSON.parse(raw) as Partial<NotifPrefs> & { stocks?: boolean };
    return {
      ...defaultNotifPrefs,
      ...parsed,
      stock: parsed.stock ?? parsed.stocks ?? defaultNotifPrefs.stock,
    };
  } catch {
    return { ...defaultNotifPrefs };
  }
}

export function writeNotifPrefs(prefs: NotifPrefs): void {
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('genoma:notificacoes-prefs'));
  } catch {
    // ignore quota errors
  }
}

export function categoriaToPrefKey(categoria: NotificacaoCategoria): NotifPrefKey | null {
  if (categoria === 'lembrete') return 'lembretes';
  if (categoria === 'stock') return 'stock';
  if (categoria.startsWith('processo_')) return 'processos';
  if (categoria.startsWith('contacto_')) return 'contactos';
  if (categoria.startsWith('faturacao_contacto')) return 'faturacao_contacto';
  if (categoria.startsWith('faturacao_processo')) return 'faturacao_processo';
  return null;
}

export function notificationMatchesPrefs(
  n: { categoria?: NotificacaoCategoria },
  prefs: NotifPrefs,
): boolean {
  if (!n.categoria) return true;
  const key = categoriaToPrefKey(n.categoria);
  if (!key || key === 'email') return true;
  return prefs[key] !== false;
}

export const NOTIFICACAO_FILTER_GROUPS: NotificacaoFilterGroup[] = [
  'todas',
  'nao_lidas',
  'processos',
  'contactos',
  'faturacao_contacto',
  'faturacao_processo',
  'stock',
  'lembretes',
];

const FILTER_GROUP_CATEGORIAS: Record<Exclude<NotificacaoFilterGroup, 'todas' | 'nao_lidas'>, NotificacaoCategoria[]> = {
  processos: ['processo_criado', 'processo_alterado'],
  contactos: ['contacto_criado', 'contacto_alterado'],
  faturacao_contacto: ['faturacao_contacto_emitir', 'faturacao_contacto_pago'],
  faturacao_processo: ['faturacao_processo_emitir', 'faturacao_processo_pago'],
  stock: ['stock'],
  lembretes: ['lembrete'],
};

export function notificationMatchesFilter(
  n: { categoria: NotificacaoCategoria; lida: boolean },
  filter: NotificacaoFilterGroup,
): boolean {
  if (filter === 'todas') return true;
  if (filter === 'nao_lidas') return !n.lida;
  return FILTER_GROUP_CATEGORIAS[filter].includes(n.categoria);
}

export function countNotificationsForFilter(
  items: { categoria: NotificacaoCategoria; lida: boolean }[],
  filter: NotificacaoFilterGroup,
): number {
  return items.filter((n) => notificationMatchesFilter(n, filter)).length;
}

export function countUnreadForFilter(
  items: { categoria: NotificacaoCategoria; lida: boolean }[],
  filter: NotificacaoFilterGroup,
): number {
  return items.filter((n) => !n.lida && notificationMatchesFilter(n, filter)).length;
}
