/** Tabs de Relatórios visíveis na sidebar e na matriz de permissões (ordem fixa). */
export const LISTINGS_NAV_ORDER = [
  'painel_bordo',
  'resultados',
  'faturacao',
  'colheitas',
  'kits',
  'lotes',
  'auditoria',
] as const;

export type ListingsNavKey = (typeof LISTINGS_NAV_ORDER)[number];

export function createEmptyListingsNavPermissions(): Record<ListingsNavKey, boolean> {
  return Object.fromEntries(LISTINGS_NAV_ORDER.map((k) => [k, false])) as Record<ListingsNavKey, boolean>;
}

export function createFullListingsNavPermissions(): Record<ListingsNavKey, boolean> {
  return Object.fromEntries(LISTINGS_NAV_ORDER.map((k) => [k, true])) as Record<ListingsNavKey, boolean>;
}

/** Converte permissões legadas (exames/processos) para as tabs actuais. */
export function migrateListingsSubmodulePermissions(
  raw: Record<string, boolean> | undefined | null,
): Record<ListingsNavKey, boolean> {
  const next = createEmptyListingsNavPermissions();
  if (!raw || typeof raw !== 'object') return next;

  for (const key of LISTINGS_NAV_ORDER) {
    if (typeof raw[key] === 'boolean') next[key] = raw[key];
  }

  if (typeof raw.exames === 'boolean') {
    next.resultados = raw.exames || next.resultados;
  }
  if (typeof raw.processos === 'boolean') {
    next.painel_bordo = raw.processos || next.painel_bordo;
  }

  return next;
}
