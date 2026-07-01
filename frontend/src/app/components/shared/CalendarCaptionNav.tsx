import { format, setMonth, setYear, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CaptionProps } from 'react-day-picker';
import { useNavigation } from 'react-day-picker';
import { cn } from '../ui/utils';

type CalendarCaptionNavProps = CaptionProps & {
  fromYear: number;
  toYear: number;
  fromDate?: Date;
  toDate?: Date;
};

const selectClass =
  'h-8 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-sm capitalize text-slate-800 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#334155]/60 dark:bg-[#151f30]/70 dark:text-slate-200 dark:hover:border-[#405068]/70';

const navBtnClass =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-35 dark:border-[#334155]/60 dark:text-slate-300 dark:hover:bg-[#151f30]';

function clampMonth(date: Date, fromDate?: Date, toDate?: Date) {
  let next = startOfMonth(date);
  if (fromDate && next < startOfMonth(fromDate)) next = startOfMonth(fromDate);
  if (toDate && next > startOfMonth(toDate)) next = startOfMonth(toDate);
  return next;
}

function monthOptionsForYear(year: number, fromDate?: Date, toDate?: Date) {
  const fromMonth = fromDate && fromDate.getFullYear() === year ? fromDate.getMonth() : 0;
  const toMonth = toDate && toDate.getFullYear() === year ? toDate.getMonth() : 11;
  return Array.from({ length: toMonth - fromMonth + 1 }, (_, i) => fromMonth + i);
}

export function CalendarCaptionNav({
  displayMonth,
  fromYear,
  toYear,
  fromDate,
  toDate,
}: CalendarCaptionNavProps) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation();

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i);
  const year = displayMonth.getFullYear();
  const monthIndex = displayMonth.getMonth();
  const availableMonths = monthOptionsForYear(year, fromDate, toDate);

  const goTo = (nextYear: number, nextMonthIndex: number) => {
    goToMonth(clampMonth(setYear(setMonth(displayMonth, nextMonthIndex), nextYear), fromDate, toDate));
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Mês anterior"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className={navBtnClass}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <div className="relative min-w-0">
          <select
            aria-label="Mês"
            value={monthIndex}
            onChange={(e) => goTo(year, Number(e.target.value))}
            className={cn(selectClass, 'w-[7.25rem] max-w-[42vw]')}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {format(new Date(2024, m, 1), 'MMMM', { locale: pt })}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>

        <div className="relative shrink-0">
          <select
            aria-label="Ano"
            value={year}
            onChange={(e) => {
              const nextYear = Number(e.target.value);
              const months = monthOptionsForYear(nextYear, fromDate, toDate);
              goTo(nextYear, months.includes(monthIndex) ? monthIndex : months[0] ?? 0);
            }}
            className={cn(selectClass, 'w-[4.75rem] tabular-nums')}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <button
        type="button"
        aria-label="Mês seguinte"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className={navBtnClass}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
