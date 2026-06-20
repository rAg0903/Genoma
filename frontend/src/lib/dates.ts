/**
 * Converte colunas DATE ou strings ISO para YYYY-MM-DD sem desvio de fuso horário.
 * Evita que "2026-06-12" guardado na BD apareça como "2026-06-11" após serialização UTC.
 */
export function normalizeCalendarDate(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

/** Data de hoje no calendário local (YYYY-MM-DD). */
export function todayLocal(): string {
  return normalizeCalendarDate(new Date());
}

/** Converte YYYY-MM-DD para Date local (meia-noite local, sem desvio UTC). */
export function isoToLocalDate(value?: string | null): Date | undefined {
  const normalized = normalizeCalendarDate(value ?? '');
  if (!normalized) return undefined;
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Formata YYYY-MM-DD para exibição pt-PT sem desvio de fuso. */
export function formatCalendarDatePt(value?: string | null): string {
  const normalized = normalizeCalendarDate(value ?? '');
  if (!normalized) return '—';
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-PT');
}
