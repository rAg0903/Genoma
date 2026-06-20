/**
 * Utilitários de data de calendário (sem desvio de fuso horário).
 * Colunas DATE na BD devem ser tratadas como dia civil, não instante UTC.
 */

const pad2 = (n) => String(n).padStart(2, '0');

exports.normalizeCalendarDate = (value) => {
  if (value == null || value === '') return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

exports.todayCalendar = () => exports.normalizeCalendarDate(new Date());

exports.isPastCalendarDate = (value) => {
  const normalized = exports.normalizeCalendarDate(value);
  if (!normalized) return false;
  return normalized < exports.todayCalendar();
};
