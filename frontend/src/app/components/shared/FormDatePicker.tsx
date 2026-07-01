import { CONTROL, FORM } from '../../../lib/design-tokens';
import { cn } from '../ui/utils';
import { MinDatePicker } from './MinDatePicker';

type FormDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAnyDate?: boolean;
  minDate?: string;
  allowExistingPastDate?: boolean;
};

/** Date picker com calendário customizado (substitui input type="date" nativo). */
export function FormDatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  allowAnyDate = true,
  minDate,
  allowExistingPastDate = false,
}: FormDatePickerProps) {
  return (
    <MinDatePicker
      value={value}
      onChange={onChange}
      allowAnyDate={allowAnyDate}
      minDate={minDate}
      allowExistingPastDate={allowExistingPastDate}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(CONTROL.input, disabled && FORM.disabledInput)}
    />
  );
}
