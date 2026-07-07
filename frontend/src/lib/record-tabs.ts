export type ProcessTabId =
  | 'identificacao'
  | 'gravidez'
  | 'colheita'
  | 'faturacao'
  | 'resultados'
  | 'kits'
  | 'notas'
  | 'anexos';

export type ContactTabId =
  | 'identificacao'
  | 'gravidez'
  | 'colheita'
  | 'faturacao'
  | 'notas'
  | 'anexos';

export const PROCESS_TAB_IDS = new Set<ProcessTabId>([
  'identificacao',
  'gravidez',
  'colheita',
  'faturacao',
  'resultados',
  'kits',
  'notas',
  'anexos',
]);

export const CONTACT_TAB_IDS = new Set<ContactTabId>([
  'identificacao',
  'gravidez',
  'colheita',
  'faturacao',
  'notas',
  'anexos',
]);

export function parseTabParam<T extends string>(
  value: string | null,
  allowed: ReadonlySet<T>,
  fallback: T,
): T {
  if (value && allowed.has(value as T)) return value as T;
  return fallback;
}

export function withTabQuery(path: string, tab?: string | null): string {
  if (!tab) return path;
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('tab', tab);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function withRecordQuery(
  path: string,
  options?: { tab?: string | null; edit?: boolean },
): string {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  if (options?.tab) params.set('tab', options.tab);
  if (options?.edit) params.set('edit', '1');
  else if (options?.edit === false) params.delete('edit');
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Mapeia separadores do drawer de processos para o formulário de edição. */
export function mapProcessDrawerTabToFormTab(drawerTab: string): ProcessTabId {
  switch (drawerTab) {
    case 'faturacao':
      return 'faturacao';
    case 'resultado':
    case 'relatorio':
      return 'resultados';
    case 'trace':
      return 'kits';
    default:
      return 'identificacao';
  }
}
