import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarDay } from '../../../lib/api-agendamentos';
import { CALENDAR_LOAD_COLORS } from '../../../lib/design-tokens';

interface AgendaCalendarProps {
  month: Date;
  days: CalendarDay[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function AgendaCalendar({ month, days, selectedDate, onSelectDate, onPrevMonth, onNextMonth }: AgendaCalendarProps) {
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
          {month.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-semibold text-slate-400 py-1">{w}</div>
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
              onClick={() => onSelectDate(cellIso)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition ${
                isSelected ? 'bg-teal-600 text-white' : isToday ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className={isSelected ? 'font-bold' : ''}>{cell.getDate()}</span>
              {info && info.total > 0 && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? '#fff' : CALENDAR_LOAD_COLORS[info.cor] }}
                  title={`${info.total} colheita(s)`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {[['verde', '1'], ['amarelo', '2'], ['vermelho', '3+']].map(([cor, label]) => (
          <span key={cor} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CALENDAR_LOAD_COLORS[cor] }} /> {label} colheita(s)
          </span>
        ))}
      </div>
    </div>
  );
}
