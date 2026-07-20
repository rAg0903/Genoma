import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarDay } from '../../../lib/api-agendamentos';
import { CALENDAR_LOAD_COLORS, CONTROL, DETAIL, FORM, SURFACE } from '../../../lib/design-tokens';
import { FormRadixSelect } from '../shared/FormPageChrome';

interface PostoOption {
  id: string;
  nome: string;
}

interface AgendaCalendarProps {
  month: Date;
  days: CalendarDay[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  postos?: PostoOption[];
  postoFilter?: string;
  onPostoChange?: (id: string) => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const ALL_POSTOS_VALUE = '__all__';
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Célula do calendário — mesmo padrão dos toggles teal (Administração / sub-testes). */
const dayCellBase =
  'relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40';

function dayCellClass(isSelected: boolean, isToday: boolean) {
  if (isSelected) {
    return [
      dayCellBase,
      'border-teal-300 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-400 font-semibold',
    ].join(' ');
  }
  if (isToday) {
    return [
      dayCellBase,
      'border-teal-200 bg-teal-50/60 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300',
      'hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40',
    ].join(' ');
  }
  return [
    dayCellBase,
    'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
    'hover:border-teal-300 hover:bg-slate-50 dark:hover:border-teal-700 dark:hover:bg-slate-800/60',
  ].join(' ');
}

const LEGEND_ITEMS = [
  { cor: 'verde' as const, label: '1 agend.' },
  { cor: 'amarelo' as const, label: '2 agend.' },
  { cor: 'vermelho' as const, label: '3+ agend.' },
] as const;

export function AgendaCalendar({
  month,
  days,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  postos,
  postoFilter,
  onPostoChange,
}: AgendaCalendarProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startOffset = (first.getDay() + 6) % 7; // segunda = 0
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const todayIso = iso(new Date());

  const byDay = new Map(days.map((d) => [d.dia, d]));
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const postoOptions = [
    { value: ALL_POSTOS_VALUE, label: 'Todos os postos' },
    ...(postos ?? []).map((p) => ({ value: p.id, label: p.nome })),
  ];

  return (
    <div className={`${SURFACE.cardElevated} p-4 flex flex-col gap-3`}>
      {/* Cabeçalho: mês + navegação */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
          {month.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className={`${CONTROL.buttonGhost} p-1.5`}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className={`${CONTROL.buttonGhost} p-1.5`}
            aria-label="Mês seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grade do calendário */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[11px] font-semibold text-slate-400 py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const cellIso = iso(cell);
            const info = byDay.get(cellIso);
            const isToday = cellIso === todayIso;
            const isSelected = cellIso === selectedDate;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDate(cellIso)}
                className={dayCellClass(isSelected, isToday)}
                aria-pressed={isSelected}
                aria-label={`${cell.getDate()} de ${month.toLocaleDateString('pt-PT', { month: 'long' })}${info?.total ? `, ${info.total} agendamento(s)` : ''}`}
              >
                <span>{cell.getDate()}</span>
                {info && info.total > 0 && (
                  <span
                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: CALENDAR_LOAD_COLORS[info.cor] }}
                    title={`${info.total} agendamento(s)`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda de carga — grelha compacta, texto numa linha */}
      <div className={`pt-2.5 ${DETAIL.divider} border-t`}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Carga diária
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {LEGEND_ITEMS.map(({ cor, label }) => (
            <span
              key={cor}
              title={`${label.replace(' agend.', '')} agendamento(s) por dia`}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200/80 bg-slate-50/70 px-1.5 py-1 text-[10px] font-medium text-slate-600 whitespace-nowrap dark:border-slate-700/80 dark:bg-slate-800/40 dark:text-slate-400"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: CALENDAR_LOAD_COLORS[cor] }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Filtro por posto — dropdown Radix alinhado ao resto da app */}
      {postos && postos.length > 0 && onPostoChange && (
        <div className={`pt-2 ${DETAIL.divider} border-t`}>
          <label className={`${FORM.label} mb-1.5 block`}>
            Filtrar por posto
          </label>
          <FormRadixSelect
            value={postoFilter || ALL_POSTOS_VALUE}
            onChange={(v) => onPostoChange(v === ALL_POSTOS_VALUE ? '' : v)}
            placeholder="Todos os postos"
            options={postoOptions}
          />
        </div>
      )}
    </div>
  );
}
