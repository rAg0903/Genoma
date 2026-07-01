import { AlertTriangle } from 'lucide-react';
import { ProcessFaturacaoData } from '../../../lib/process-form';
import { getFaturacaoAlert } from '../../../lib/faturacao';

interface FaturacaoAlertBannerProps {
  value: ProcessFaturacaoData;
  context?: 'contacto' | 'processo';
  onGoToFaturacao?: () => void;
}

export function FaturacaoAlertBanner({ value, context = 'contacto', onGoToFaturacao }: FaturacaoAlertBannerProps) {
  const alert = getFaturacaoAlert(value, context);
  if (!alert) return null;

  const isNaoFacturado = alert.type === 'nao_facturado';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
        isNaoFacturado
          ? 'bg-amber-50 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800/35 text-amber-900 dark:text-amber-200/90'
          : 'bg-orange-50 dark:bg-orange-950/15 border-orange-200 dark:border-orange-800/35 text-orange-900 dark:text-orange-200/90'
      }`}
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '13px', fontWeight: 600 }}>
          {isNaoFacturado ? 'Faturação pendente' : 'Pagamento pendente'}
        </p>
        <p className="mt-0.5 opacity-90" style={{ fontSize: '13px' }}>{alert.message}</p>
        {onGoToFaturacao && (
          <button
            type="button"
            onClick={onGoToFaturacao}
            className="mt-2 underline underline-offset-2 hover:opacity-80"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            Ir para Faturação
          </button>
        )}
      </div>
    </div>
  );
}
