import { AlertTriangle } from 'lucide-react';
import { Processo } from '../../data/types';
import { getProcessDataQualityIssues } from '../../../lib/process-data-quality';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ProcessDataQualityBannerProps {
  processo: Processo;
}

export function ProcessDataQualityBanner({ processo }: ProcessDataQualityBannerProps) {
  const { t } = useLanguage();
  const issues = getProcessDataQualityIssues(processo);
  if (issues.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-amber-50 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800/35 text-amber-900 dark:text-amber-200/90"
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1">
        <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('ux.dataQuality.title')}</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {issues.map((issue) => (
            <li key={issue.id} className="opacity-90" style={{ fontSize: '13px' }}>
              {t(issue.messageKey)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
