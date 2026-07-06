import { HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppModal, ModalActions } from '../components/shared/AppModal';

export type ConfirmActionOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: LucideIcon;
};

type PendingConfirm = ConfirmActionOptions & {
  resolve: (confirmed: boolean) => void;
};

type ConfirmActionContextValue = {
  confirmAction: (options: ConfirmActionOptions) => Promise<boolean>;
};

const ConfirmActionContext = createContext<ConfirmActionContextValue | undefined>(undefined);

function ConfirmActionDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  icon: Icon = HelpCircle,
  onCancel,
  onConfirm,
}: ConfirmActionOptions & { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLanguage();

  return (
    <AppModal
      title={title}
      icon={Icon}
      iconClassName={variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}
      onClose={onCancel}
      footer={(
        <ModalActions
          onCancel={onCancel}
          onSubmit={onConfirm}
          cancelLabel={cancelLabel ?? t('common.cancel')}
          submitLabel={confirmLabel ?? t('ux.confirmAction.confirm')}
          variant={variant}
        />
      )}
    >
      <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-200">{message}</p>
    </AppModal>
  );
}

export function ConfirmActionProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const finish = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    current.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirmAction = useCallback((options: ConfirmActionOptions) => {
    return new Promise<boolean>((resolve) => {
      const entry: PendingConfirm = { ...options, resolve };
      pendingRef.current = entry;
      setPending(entry);
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending, finish]);

  return (
    <ConfirmActionContext.Provider value={{ confirmAction }}>
      {children}
      {pending ? (
        <ConfirmActionDialog
          title={pending.title}
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          cancelLabel={pending.cancelLabel}
          variant={pending.variant}
          icon={pending.icon}
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      ) : null}
    </ConfirmActionContext.Provider>
  );
}

export function useConfirmAction() {
  const ctx = useContext(ConfirmActionContext);
  if (!ctx) {
    throw new Error('useConfirmAction must be used within ConfirmActionProvider');
  }
  return ctx.confirmAction;
}
