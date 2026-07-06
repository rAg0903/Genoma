import { ArrowLeft } from 'lucide-react';
import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { CONTROL, FORM, FormFieldWidth, PAGE } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../ui/utils';
import { SlidingTabItem, SlidingTabs, SlidingTabsSlot } from './SlidingTabs';

type FormPageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Contentor de páginas de formulário / detalhe (alinhado com o Painel). */
export function FormPageShell({ children, className = '' }: FormPageShellProps) {
  return (
    <div className={`${PAGE.shell} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  );
}

export function FormPageBody({ children, className = '' }: FormPageShellProps) {
  return <div className={`${PAGE.body} ${className}`}>{children}</div>;
}

type FormPageHeaderProps<T extends string> = {
  onBack: () => void;
  title: string;
  titleExtra?: ReactNode;
  subtitle?: string;
  avatar?: ReactNode;
  actions?: ReactNode;
  tabs?: SlidingTabItem<T>[];
  activeTab?: T;
  onTabChange?: (id: T) => void;
  tabsAriaLabel?: string;
  backAriaLabel?: string;
};

/** Cabeçalho de formulário: voltar, avatar, título, acções e tabs deslizantes. */
export function FormPageHeader<T extends string>({
  onBack,
  title,
  titleExtra,
  subtitle,
  avatar,
  actions,
  tabs,
  activeTab,
  onTabChange,
  tabsAriaLabel,
  backAriaLabel,
}: FormPageHeaderProps<T>) {
  const { t } = useLanguage();

  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label={backAriaLabel ?? t('form.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {avatar ? <div className="flex-shrink-0">{avatar}</div> : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className={`${PAGE.title} truncate`}>{title}</h1>
            {titleExtra}
          </div>
          {subtitle ? <p className={`${PAGE.subtitle} truncate`}>{subtitle}</p> : null}
        </div>

        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>

      {tabs && tabs.length > 0 && activeTab && onTabChange ? (
        <SlidingTabsSlot>
          <SlidingTabs
            items={tabs}
            active={activeTab}
            onChange={onTabChange}
            ariaLabel={tabsAriaLabel ?? t('form.sectionsAria')}
          />
        </SlidingTabsSlot>
      ) : null}
    </header>
  );
}

type FormPrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  form?: string;
  className?: string;
};

/** Botão Guardar / Criar — outline teal (igual a «+ Novo …» nas listagens). */
export function FormPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  form,
  className = '',
}: FormPrimaryButtonProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={`${ADD_ACTION_BUTTON_CLASS} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/** Avatar circular com iniciais (formulários). */
export function FormAvatarInitials({ initials, tone = 'brand' }: { initials: string; tone?: 'brand' | 'info' }) {
  const tones = {
    brand: 'bg-teal-100 dark:bg-teal-900/25 text-teal-700 dark:text-teal-300',
    info: 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${tones[tone]}`}>
      <span className="text-[15px] font-bold">{initials}</span>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  width?: FormFieldWidth;
  className?: string;
  controlClassName?: string;
  children: ReactNode;
};

/** Campo de formulário com label e largura fixa opcional. */
export function FormField({
  label,
  required,
  hint,
  width = 'md',
  className = '',
  controlClassName = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`${FORM.fieldWidth[width]} ${className}`}>
      <div className={FORM.labelArea}>
        <label className={FORM.label}>
          {label}
          {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
        </label>
      </div>
      <div className={`${FORM.fieldControl} ${controlClassName}`}>{children}</div>
      {hint ? <p className={FORM.hint}>{hint}</p> : null}
    </div>
  );
}

type FormFieldAccessoryProps = {
  width?: FormFieldWidth;
  className?: string;
  children: ReactNode;
};

/** Botões/checkboxes/alerts na mesma linha que FormField — respeita a área do label. */
export function FormFieldAccessory({
  width,
  className = '',
  children,
}: FormFieldAccessoryProps) {
  const widthClass = width ? FORM.fieldWidth[width] : '';
  return (
    <div className={`${widthClass} flex flex-col ${className}`.trim()}>
      <div className={FORM.labelArea} aria-hidden="true" />
      <div className={FORM.fieldControlAlign}>{children}</div>
    </div>
  );
}

type FormControlProps = {
  className?: string;
  disabled?: boolean;
};

export function FormInput({ className = '', disabled, type, ...props }: InputHTMLAttributes<HTMLInputElement> & FormControlProps) {
  const isNumber = type === 'number';
  return (
    <input
      type={type}
      disabled={disabled}
      className={[
        CONTROL.input,
        isNumber ? CONTROL.numberInput : '',
        disabled ? FORM.disabledInput : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function FormSelect({ className = '', disabled, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FormControlProps) {
  return (
    <select
      disabled={disabled}
      className={[
        CONTROL.input,
        CONTROL.select,
        disabled ? FORM.disabledInput : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & FormControlProps) {
  return <textarea className={`${CONTROL.textarea} ${className}`} {...props} />;
}

/** Campo só leitura com aparência de input (formulários de processo, etc.). */
export function FormReadOnlyInput({
  value,
  className = '',
  mono,
}: {
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <input
      readOnly
      tabIndex={-1}
      value={value}
      className={[
        CONTROL.input,
        FORM.readOnlyInput,
        mono ? 'font-mono tabular-nums' : '',
        className,
      ].filter(Boolean).join(' ')}
    />
  );
}

export function FormNumberInput({
  className = '',
  disabled,
  inputMode = 'decimal',
  type: _type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FormControlProps & { inputMode?: 'numeric' | 'decimal' }) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      disabled={disabled}
      autoComplete="off"
      className={[
        CONTROL.input,
        CONTROL.numberInput,
        disabled ? FORM.disabledInput : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

type FormRadixSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  options: { value: string; label: string }[];
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Select customizado (Radix) — dropdown alinhado ao tema CRM. */
export function FormRadixSelect({
  value,
  onChange,
  placeholder = 'Selecione…',
  disabled,
  options,
  footer,
  open,
  onOpenChange,
}: FormRadixSelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger
        className={cn(
          CONTROL.input,
          'justify-between font-normal shadow-sm shadow-slate-900/[0.03] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
          value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500',
          disabled && FORM.disabledInput,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={FORM.selectContent} position="popper">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className={FORM.selectItem}>
            {opt.label}
          </SelectItem>
        ))}
        {footer ? (
          <>
            <SelectSeparator className="my-1 bg-slate-200 dark:bg-slate-700" />
            <div
              className="px-1 pb-1"
              onPointerDown={(event) => event.preventDefault()}
            >
              {footer}
            </div>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}

/** Contentor de tab de formulário — usa a largura disponível do painel. */
export function FormTabContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${FORM.tabContent} ${className}`}>{children}</div>;
}

type FormSectionNoteProps = {
  children: ReactNode;
  className?: string;
};

/** Nota informativa no rodapé de uma secção de formulário. */
export function FormSectionNote({ children, className = '' }: FormSectionNoteProps) {
  return <p className={`${FORM.sectionNote} ${className}`}>{children}</p>;
}

type FormInlineAlertProps = {
  tone?: 'info' | 'warning' | 'success';
  children: ReactNode;
  className?: string;
};

const INLINE_ALERT: Record<NonNullable<FormInlineAlertProps['tone']>, string> = {
  info: FORM.alertInfo,
  warning: FORM.alertWarning,
  success:
    'rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/25 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300',
};

/** Alerta compacto inline (stock, validação, etc.). */
export function FormInlineAlert({ tone = 'info', children, className = '' }: FormInlineAlertProps) {
  return <div className={`flex items-start gap-2 ${INLINE_ALERT[tone]} ${className}`}>{children}</div>;
}
