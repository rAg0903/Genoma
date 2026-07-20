import { LucideIcon, X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CONTROL, FORM, MODAL, SURFACE, TYPOGRAPHY } from '../../../lib/design-tokens';

type AppModalProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
  /** Se true, o corpo usa stack vertical padrão (space-y-4). */
  formBody?: boolean;
};

/** Modal padrão da aplicação (Admin, Inventário, etc.). */
export function AppModal({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-slate-600 dark:text-slate-400',
  onClose,
  children,
  wide = false,
  footer,
  formBody = false,
}: AppModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const modal = (
    <div
      className={MODAL.overlay}
      style={{ fontFamily: 'Inter, sans-serif' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${SURFACE.cardElevated} shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-hidden flex flex-col max-h-[min(90vh,calc(100vh-6rem))] my-2 sm:my-4 shrink-0`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b shrink-0 ${MODAL.headerBorder}`}>
          <div className="min-w-0 flex items-start gap-2.5">
            {Icon ? <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClassName}`} /> : null}
            <div className="min-w-0">
              <h2 id="app-modal-title" className={`${TYPOGRAPHY.title} text-slate-900 dark:text-slate-100`}>
                {title}
              </h2>
              {subtitle ? (
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={MODAL.closeBtn}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-5 overflow-y-auto flex-1 min-h-0 ${formBody ? FORM.stack : ''}`}>
          {children}
        </div>

        {footer ? (
          <div className={MODAL.footer}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

type ModalFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

/** Campo de formulário dentro de modal (label + input). */
export function ModalField({ label, required, hint, children }: ModalFieldProps) {
  return (
    <div>
      <div className={FORM.labelArea}>
        <label className={FORM.label}>
          {label}
          {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
        </label>
      </div>
      <div className={FORM.fieldControlAlign}>{children}</div>
      {hint ? <p className={FORM.hint}>{hint}</p> : null}
    </div>
  );
}

type ModalAlertProps = {
  children: ReactNode;
  tone?: 'info' | 'warning';
};

export function ModalAlert({ children, tone = 'info' }: ModalAlertProps) {
  return (
    <div className={tone === 'warning' ? FORM.alertWarning : FORM.alertInfo}>
      {children}
    </div>
  );
}

type ModalCheckboxProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ModalCheckbox({ label, checked, onChange }: ModalCheckboxProps) {
  return (
    <label className={FORM.checkboxRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={FORM.checkbox}
      />
      <span>{label}</span>
    </label>
  );
}

/** Classe partilhada para inputs/selects/textarea em modais. */
export const MODAL_INPUT_CLASS = CONTROL.input;

type ModalActionsProps = {
  onCancel: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  isEdit?: boolean;
  formId?: string;
  submitDisabled?: boolean;
  variant?: 'default' | 'danger';
};

/** Rodapé de modal com Cancelar + submeter. */
export function ModalActions({
  onCancel,
  onSubmit,
  submitLabel,
  cancelLabel = 'Cancelar',
  saving = false,
  isEdit = false,
  formId,
  submitDisabled = false,
  variant = 'default',
}: ModalActionsProps) {
  const label = submitLabel ?? (saving ? 'A guardar…' : isEdit ? 'Guardar' : 'Criar');
  const submitClass =
    variant === 'danger'
      ? `${CONTROL.buttonPrimary} !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 disabled:opacity-60 disabled:cursor-not-allowed`
      : `${CONTROL.buttonPrimary} disabled:opacity-60 disabled:cursor-not-allowed`;

  return (
    <>
      <button type="button" onClick={onCancel} className={CONTROL.buttonSecondary}>
        {cancelLabel}
      </button>
      <button
        type={formId ? 'submit' : 'button'}
        form={formId}
        onClick={formId ? undefined : onSubmit}
        disabled={saving || submitDisabled}
        className={submitClass}
      >
        {label}
      </button>
    </>
  );
}
