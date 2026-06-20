import { useEffect, useMemo, useState } from 'react';
import { pt } from 'date-fns/locale';
import { isSameMonth, startOfMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { formatCalendarDatePt, isoToLocalDate, normalizeCalendarDate, todayLocal } from '../../../lib/dates';
import { cn } from '../ui/utils';

type MinDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  /** Em edição: mostra e mantém selecionável a data já registada, mesmo que seja passada. */
  allowExistingPastDate?: boolean;
  /** Permite qualquer data (ex.: filtros de pesquisa em registos históricos). */
  allowAnyDate?: boolean;
  className?: string;
  placeholder?: string;
};

export function MinDatePicker({
  value,
  onChange,
  minDate = todayLocal(),
  allowExistingPastDate = false,
  allowAnyDate = false,
  className,
  placeholder = 'Selecionar data',
}: MinDatePickerProps) {
  const [open, setOpen] = useState(false);

  const todayMin = useMemo(() => isoToLocalDate(minDate) ?? isoToLocalDate(todayLocal())!, [minDate]);
  const todayMinIso = useMemo(() => normalizeCalendarDate(todayMin), [todayMin]);
  const valueDate = useMemo(() => isoToLocalDate(value), [value]);
  const valueIso = useMemo(() => normalizeCalendarDate(value), [value]);

  const navFromMonth = useMemo(() => {
    if (allowAnyDate) return new Date(2020, 0, 1);
    if (allowExistingPastDate && valueDate && valueDate < todayMin) {
      return startOfMonth(valueDate);
    }
    return startOfMonth(todayMin);
  }, [allowAnyDate, allowExistingPastDate, valueDate, todayMin]);

  const selected = valueDate ?? undefined;

  const [month, setMonth] = useState(() => startOfMonth(valueDate ?? todayMin));

  useEffect(() => {
    if (!open) return;
    setMonth(startOfMonth(valueDate ?? todayMin));
  }, [open, valueDate, todayMin]);

  const displayLabel = value ? formatCalendarDatePt(value) : placeholder;

  const isOutsideNextMonth = (date: Date) =>
    !isSameMonth(date, month) && startOfMonth(date).getTime() > month.getTime();

  const isDayDisabled = (date: Date) => {
    if (allowAnyDate) return false;
    const iso = normalizeCalendarDate(date);
    if (allowExistingPastDate && valueIso && iso === valueIso) return false;
    return iso < todayMinIso;
  };

  const isDateDisabled = (date: Date) => {
    if (allowAnyDate) return false;
    if (!isSameMonth(date, month)) {
      if (isOutsideNextMonth(date)) return isDayDisabled(date);
      return true;
    }
    return isDayDisabled(date);
  };

  const handleSelect = (date?: Date) => {
    if (!date || isDayDisabled(date)) return;

    if (!isSameMonth(date, month)) {
      if (allowAnyDate || isOutsideNextMonth(date)) {
        const nextMonth = startOfMonth(date);
        setMonth(nextMonth < navFromMonth ? navFromMonth : nextMonth);
      } else if (!allowAnyDate) {
        return;
      }
    }

    onChange(normalizeCalendarDate(date));
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 text-left',
            !value && 'text-slate-400',
            className,
          )}
        >
          <span>{displayLabel}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[60] w-auto border-slate-200 bg-white p-0 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        align="start"
      >
        <Calendar
          mode="single"
          locale={pt}
          month={month}
          onMonthChange={(nextMonth) => {
            setMonth(nextMonth < navFromMonth ? navFromMonth : nextMonth);
          }}
          selected={selected}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          fromMonth={navFromMonth}
          weekStartsOn={1}
          defaultMonth={startOfMonth(valueDate ?? todayMin)}
          captionLayout="buttons"
          showOutsideDays
          classNames={{
            months: 'p-3',
            month: 'space-y-3',
            table: 'w-[252px] border-collapse',
            caption: 'relative flex items-center justify-center px-8',
            caption_label: 'text-sm font-semibold capitalize text-slate-800 dark:text-slate-100',
            nav: 'flex items-center',
            nav_button:
              'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
            nav_button_previous: 'absolute left-0',
            nav_button_next: 'absolute right-0',
            head_row: 'flex w-full',
            head_cell:
              'w-9 shrink-0 text-center text-[0.75rem] font-medium text-slate-500 dark:text-slate-400',
            row: 'mt-1 flex w-full',
            cell: 'h-9 w-9 shrink-0 p-0 text-center text-sm',
            day: 'mx-auto h-9 w-9 rounded-md p-0 font-normal text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
            day_outside:
              'text-slate-400 opacity-60 hover:text-slate-500 dark:text-slate-500 aria-selected:bg-teal-600 aria-selected:text-white',
            day_selected:
              'bg-teal-600 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white',
            day_today: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
            day_disabled: 'pointer-events-none text-slate-400 opacity-40 dark:text-slate-500',
            day_hidden: 'invisible',
          }}
        />
        <div className="flex justify-end border-t border-slate-200 px-3 py-2 dark:border-slate-700">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
