import { useMemo, useState, type FormEvent } from 'react';
import { Ban, X } from 'lucide-react';
import { Processo, type MotivoAnulacao } from '../../data/types';
import { FORM_INPUT_CLASS } from '../../../lib/design-system';
import { filterMotivosPorContexto, getMotivoProcessoCancelHint } from '../../../lib/motivos-anulacao';

type CancelProcessoDialogProps = {
  processo: Processo | null;
  bulkCount?: number;
  motivos: MotivoAnulacao[];
  onClose: () => void;
  onConfirm: (motivoId: string) => Promise<void>;
};

export function CancelProcessoDialog({ processo, bulkCount, motivos, onClose, onConfirm }: CancelProcessoDialogProps) {
  const [motivoId, setMotivoId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const motivosProcesso = useMemo(() => filterMotivosPorContexto(motivos, 'processo'), [motivos]);
  const motivoSelecionado = motivosProcesso.find((m) => m.id === motivoId);

  if (!processo && !(bulkCount && bulkCount > 0)) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!motivoId) return;
    setSubmitting(true);
    try {
      await onConfirm(motivoId);
      setMotivoId('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <Ban className="w-5 h-5" />
            <h2 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '17px', fontWeight: 600 }}>
              Cancelar processo
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {bulkCount && bulkCount > 1 ? (
              <>Cancelar <span className="font-semibold">{bulkCount} processos</span> selecionados</>
            ) : processo ? (
              <>Processo <span className="font-semibold">{processo.numero}</span> — {processo.paciente_nome}</>
            ) : null}
          </p>

          <div>
            <label className="block mb-1.5 text-gray-600 dark:text-gray-400" style={{ fontSize: '13px', fontWeight: 500 }}>
              Motivo de cancelamento <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={motivoId}
              onChange={(e) => setMotivoId(e.target.value)}
              className={FORM_INPUT_CLASS}
              style={{ fontSize: '14px' }}
            >
              <option value="">Selecione o motivo...</option>
              {motivosProcesso.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            {motivosProcesso.length === 0 && (
              <p className="text-amber-600 dark:text-amber-400 mt-2 text-xs">
                Sem motivos de processo configurados. Adicione em Administração → Motivos de anulação.
              </p>
            )}
          </div>

          {motivoSelecionado && (
            <p className="text-xs text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
              {getMotivoProcessoCancelHint(motivoSelecionado)}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              style={{ fontSize: '14px' }}
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting || !motivoId}
              className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              {submitting ? 'A cancelar...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
