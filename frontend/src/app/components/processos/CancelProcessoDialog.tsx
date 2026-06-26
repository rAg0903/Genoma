import { useMemo, useState, type FormEvent } from 'react';
import { Ban } from 'lucide-react';
import { Processo, type MotivoAnulacao } from '../../data/types';
import { FORM } from '../../../lib/design-tokens';
import { filterMotivosPorContexto, getMotivoProcessoCancelHint } from '../../../lib/motivos-anulacao';
import { AppModal, ModalActions, ModalAlert, ModalField, MODAL_INPUT_CLASS } from '../shared/AppModal';

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

  const subtitle = bulkCount && bulkCount > 1
    ? `Cancelar ${bulkCount} processos selecionados`
    : processo
      ? `${processo.numero} — ${processo.paciente_nome}`
      : undefined;

  return (
    <AppModal
      title="Cancelar processo"
      subtitle={subtitle}
      icon={Ban}
      iconClassName="text-rose-600 dark:text-rose-400"
      onClose={onClose}
      footer={(
        <ModalActions
          onCancel={onClose}
          cancelLabel="Voltar"
          submitLabel={submitting ? 'A cancelar…' : 'Confirmar cancelamento'}
          formId="cancel-processo-form"
          saving={submitting}
          submitDisabled={!motivoId}
          variant="danger"
        />
      )}
    >
      <form id="cancel-processo-form" onSubmit={(e) => void handleSubmit(e)} className={FORM.stack}>
        <ModalField label="Motivo de cancelamento" required>
          <select
            required
            value={motivoId}
            onChange={(e) => setMotivoId(e.target.value)}
            className={MODAL_INPUT_CLASS}
          >
            <option value="">Selecione o motivo...</option>
            {motivosProcesso.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </ModalField>

        {motivosProcesso.length === 0 && (
          <ModalAlert tone="warning">
            Sem motivos de processo configurados. Adicione em Administração → Motivos de anulação.
          </ModalAlert>
        )}

        {motivoSelecionado && (
          <ModalAlert>
            {getMotivoProcessoCancelHint(motivoSelecionado)}
          </ModalAlert>
        )}
      </form>
    </AppModal>
  );
}
