import { AlertTriangle, Trash2 } from 'lucide-react';
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
import { AppModal, ModalActions, ModalAlert } from '../components/shared/AppModal';

type PendingConfirm = {
  label: string;
  resolve: (confirmed: boolean) => void;
};

type ConfirmDeleteContextValue = {
  confirmDelete: (label: string) => Promise<boolean>;
};

const ConfirmDeleteContext = createContext<ConfirmDeleteContextValue | undefined>(undefined);

type ConfirmDeleteDialogProps = {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDeleteDialog({ label, onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  const { t } = useLanguage();

  return (
    <AppModal
      title={t('confirmDelete.title')}
      icon={Trash2}
      iconClassName="text-rose-600 dark:text-rose-400"
      onClose={onCancel}
      footer={(
        <ModalActions
          onCancel={onCancel}
          onSubmit={onConfirm}
          cancelLabel={t('confirmDelete.cancel')}
          submitLabel={t('confirmDelete.confirm')}
          variant="danger"
        />
      )}
    >
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-200">
          {t('confirmDelete.message', { label })}
        </p>
        <ModalAlert tone="warning">
          <span className="inline-flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('confirmDelete.warning')}</span>
          </span>
        </ModalAlert>
      </div>
    </AppModal>
  );
}

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const finish = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    current.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirmDelete = useCallback((label: string) => {
    return new Promise<boolean>((resolve) => {
      const entry: PendingConfirm = { label, resolve };
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
    <ConfirmDeleteContext.Provider value={{ confirmDelete }}>
      {children}
      {pending ? (
        <ConfirmDeleteDialog
          label={pending.label}
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      ) : null}
    </ConfirmDeleteContext.Provider>
  );
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmDeleteContext);
  if (!ctx) {
    throw new Error('useConfirmDelete must be used within ConfirmDeleteProvider');
  }
  return ctx.confirmDelete;
}
