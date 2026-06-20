/**
 * Converte valores DATE/TIMESTAMP para YYYY-MM-DD no calendário local do servidor,
 * evitando desvio de um dia ao serializar para JSON em UTC.
 */
const formatCalendarDate = (value) => {
  if (value == null || value === '') return value;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const prefix = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefix) return prefix[1];

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatCalendarDate(parsed);
  }

  return text;
};

module.exports = { formatCalendarDate };
