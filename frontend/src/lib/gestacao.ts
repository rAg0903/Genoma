import { formatCalendarDatePt, normalizeCalendarDate, todayLocal } from './dates';

const MS_DIA = 1000 * 60 * 60 * 24;
const TOTAL_PREGNANCY_DAYS = 40 * 7;

function parseCalendarDate(iso: string): Date | null {
  const normalized = normalizeCalendarDate(iso);
  if (!normalized) return null;
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffCalendarDays(from: string, to: string): number {
  const a = parseCalendarDate(from);
  const b = parseCalendarDate(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / MS_DIA);
}

function addCalendarDays(iso: string, days: number): string {
  const d = parseCalendarDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function gestacaoRegistoToTotalDays(semanas: number, dias: number): number {
  return semanas * 7 + dias;
}

export function totalDaysToSemanasDias(total: number): { semanas: number; dias: number } {
  const clamped = Math.max(0, total);
  return { semanas: Math.floor(clamped / 7), dias: clamped % 7 };
}

export function parseGestacaoRegistoInput(
  semanasRaw: string,
  diasRaw: string,
): { semanas: number; dias: number } | null {
  const s = semanasRaw.trim();
  const d = diasRaw.trim();
  if (!s && !d) return null;

  const semanas = s === '' ? 0 : Math.max(0, parseInt(s, 10) || 0);
  const dias = d === '' ? 0 : Math.min(6, Math.max(0, parseInt(d, 10) || 0));
  return { semanas, dias };
}

export function calcularGestacaoAtual(
  semanasRegisto: number,
  diasRegisto: number,
  dataRegisto: string,
  dataReferencia?: string,
): { semanas: number; dias: number } | null {
  if (!normalizeCalendarDate(dataRegisto)) return null;
  const ref = dataReferencia || todayLocal();
  const elapsed = diffCalendarDays(dataRegisto, ref);
  const total = gestacaoRegistoToTotalDays(semanasRegisto, diasRegisto) + elapsed;
  return totalDaysToSemanasDias(total);
}

export function calcularDataPartoPrevista(
  semanasRegisto: number,
  diasRegisto: number,
  dataRegisto: string,
): string | null {
  if (!normalizeCalendarDate(dataRegisto)) return null;
  const daysAtRegisto = gestacaoRegistoToTotalDays(semanasRegisto, diasRegisto);
  const daysRemaining = TOTAL_PREGNANCY_DAYS - daysAtRegisto;
  return addCalendarDays(dataRegisto, daysRemaining);
}

export function formatDataPartoPt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return formatCalendarDatePt(iso);
}

export function resolveGestacaoRegistadaEm(
  semanasRaw: string,
  diasRaw: string,
  existing?: string | null,
): string | null {
  if (!parseGestacaoRegistoInput(semanasRaw, diasRaw)) return null;
  return normalizeCalendarDate(existing) || todayLocal();
}
