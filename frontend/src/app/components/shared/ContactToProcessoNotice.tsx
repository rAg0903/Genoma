import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

type ContactToProcessoNoticeProps = {
  onDismiss: () => void;
};

export function ContactToProcessoNotice({ onDismiss }: ContactToProcessoNoticeProps) {
  const { t } = useLanguage();

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t('contactToProcesso.title')}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed opacity-90">{t('contactToProcesso.message')}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-amber-700 transition hover:bg-amber-100/80 dark:text-amber-300 dark:hover:bg-amber-900/40"
        aria-label={t('common.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
