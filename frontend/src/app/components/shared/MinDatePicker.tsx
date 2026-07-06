import { useEffect, useMemo, useState } from 'react';
import { pt } from 'date-fns/locale';
import { isSameMonth, startOfMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { CaptionProps } from 'react-day-picker';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { formatCalendarDatePt, isoToLocalDate, normalizeCalendarDate, todayLocal } from '../../../lib/dates';
import { cn } from '../ui/utils';
import { CalendarCaptionNav } from './CalendarCaptionNav';

type MinDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  /** Limite superior (ex.: data de nascimento não pode ser no futuro). */
  maxDate?: string;
  /** Em edição: mostra e mantém selecionável a data já registada, mesmo que seja passada. */
  allowExistingPastDate?: boolean;
  /** Permite qualquer data (ex.: filtros de pesquisa em registos históricos). */
  allowAnyDate?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Ano mínimo no selector (por defeito: 1920 se allowAnyDate, senão ano actual). */
  fromYear?: number;
  /** Ano máximo no selector (por defeito: ano actual se allowAnyDate, senão +5 anos). */
  toYear?: number;
};

export function MinDatePicker({
  value,
  onChange,
  minDate = todayLocal(),
  maxDate,
  allowExistingPastDate = false,
  allowAnyDate = false,
  className,
  placeholder = 'Selecionar data',
  disabled = false,
  fromYear: fromYearProp,
  toYear: toYearProp,
}: MinDatePickerProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const pickerFromYear = fromYearProp ?? (allowAnyDate ? 1920 : currentYear);
  const pickerToYear = toYearProp ?? (allowAnyDate ? currentYear : currentYear + 5);
  const pickerFromDate = useMemo(() => new Date(pickerFromYear, 0, 1), [pickerFromYear]);
  const maxDateBound = useMemo(() => (maxDate ? isoToLocalDate(maxDate) : undefined), [maxDate]);
  const pickerToDate = useMemo(() => {
    if (maxDateBound) return maxDateBound;
    return new Date(pickerToYear, 11, 31);
  }, [maxDateBound, pickerToYear]);

  const CaptionNav = useMemo(
    () => (props: CaptionProps) => (
      <CalendarCaptionNav
        {...props}
        fromYear={pickerFromYear}
        toYear={pickerToYear}
        fromDate={pickerFromDate}
        toDate={pickerToDate}
      />
    ),
    [pickerFromYear, pickerToYear, pickerFromDate, pickerToDate],
  );

  const todayMin = useMemo(() => isoToLocalDate(minDate) ?? isoToLocalDate(todayLocal())!, [minDate]);
  const todayMinIso = useMemo(() => normalizeCalendarDate(todayMin), [todayMin]);
  const maxDateIso = useMemo(
    () => (maxDateBound ? normalizeCalendarDate(maxDateBound) : undefined),
    [maxDateBound],
  );
  const valueDate = useMemo(() => isoToLocalDate(value), [value]);
  const valueIso = useMemo(() => normalizeCalendarDate(value), [value]);

  const navFromMonth = useMemo(() => {
    if (allowAnyDate) return pickerFromDate;
    if (allowExistingPastDate && valueDate && valueDate < todayMin) {
      return startOfMonth(valueDate);
    }
    return startOfMonth(todayMin);
  }, [allowAnyDate, allowExistingPastDate, pickerFromDate, valueDate, todayMin]);

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
    const iso = normalizeCalendarDate(date);
    if (allowAnyDate) {
      if (maxDateIso && iso > maxDateIso) return true;
      return false;
    }
    if (allowExistingPastDate && valueIso && iso === valueIso) return false;
    return iso < todayMinIso;
  };

  const isDateDisabled = (date: Date) => {
    if (allowAnyDate) return isDayDisabled(date);
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

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 text-left tabular-nums',
            !value && 'text-slate-400 dark:text-slate-500',
            value && 'text-slate-900 dark:text-slate-100',
            disabled && 'opacity-70 cursor-not-allowed',
            className,
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-auto border border-slate-200 bg-white p-0 shadow-lg dark:border-[#334155] dark:bg-[#1f2a3d]"
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
          fromDate={pickerFromDate}
          toDate={pickerToDate}
          fromMonth={navFromMonth}
          weekStartsOn={1}
          defaultMonth={startOfMonth(valueDate ?? todayMin)}
          captionLayout="buttons"
          components={{ Caption: CaptionNav }}
          showOutsideDays
          classNames={{
            months: 'p-3 pt-2',
            month: 'space-y-3',
            table: 'w-[252px] border-collapse',
            caption: 'relative mb-1 px-0',
            head_row: 'flex w-full',
            head_cell:
              'w-9 shrink-0 text-center text-[0.75rem] font-medium text-slate-500 dark:text-slate-400',
            row: 'mt-1 flex w-full',
            cell: 'h-9 w-9 shrink-0 p-0 text-center text-sm',
            day: 'mx-auto h-9 w-9 rounded-md p-0 font-normal text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
            day_outside:
              'text-slate-400 opacity-60 hover:text-slate-500 dark:text-slate-500 aria-selected:bg-teal-600 aria-selected:text-white',
            day_selected:
              'bg-teal-600 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white dark:bg-teal-600',
            day_today: 'bg-slate-100 text-slate-900 ring-1 ring-teal-500/30 dark:bg-[#151f30] dark:text-slate-100',
            day_disabled: 'pointer-events-none text-slate-400 opacity-40 dark:text-slate-500',
            day_hidden: 'invisible',
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 dark:border-[#334155]">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#151f30]"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#151f30]"
          >
            Cancelar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
