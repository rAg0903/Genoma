import { useEffect, useState } from 'react';
import { Loader2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';
import { agendamentosApi } from '../../../lib/api-agendamentos';
import { FORM } from '../../../lib/design-tokens';
import { AppModal, ModalActions, ModalAlert, ModalField, MODAL_INPUT_CLASS } from '../shared/AppModal';

interface AgendamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: string;
}

interface Ref { id: string; nome: string }

export function AgendamentoForm({ isOpen, onClose, onCreated, defaultDate }: AgendamentoFormProps) {
  const { contacts } = useData();
  const [medicos, setMedicos] = useState<Ref[]>([]);
  const [testes, setTestes] = useState<Ref[]>([]);
  const [postos, setPostos] = useState<Ref[]>([]);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [busy, setBusy] = useState(false);

  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [testeId, setTesteId] = useState('');
  const [postoId, setPostoId] = useState('');
  const [dataPrevista, setDataPrevista] = useState(defaultDate || '');
  const [periodo, setPeriodo] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => { if (defaultDate) setDataPrevista(defaultDate); }, [defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingRefs(true);
    Promise.all([agendamentosApi.medicos(), agendamentosApi.testes(), agendamentosApi.empresas()])
      .then(([med, tes, emp]) => {
        setMedicos(med.map((m) => ({ id: m.utilizador_id, nome: m.nome })));
        setTestes(tes.map((t) => ({ id: t.id, nome: t.nome })));
        const postoList = emp.filter((e) => e.tipo_empresa === 'POSTO');
        setPostos((postoList.length ? postoList : emp).map((e) => ({ id: e.id, nome: e.nome || 'Posto' })));
        const owner = emp.find((e) => e.tipo_empresa === 'LABORATORIO') || emp.find((e) => e.tipo_empresa === 'CLINICA') || emp[0];
        setEmpresaId(owner?.id || '');
      })
      .catch(() => toast.error('Falha ao carregar dados de referencia.'))
      .finally(() => setLoadingRefs(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!pacienteId || !medicoId || !testeId || !postoId || !dataPrevista) {
      toast.error('Preencha paciente, medico, teste, posto e data.');
      return;
    }
    setBusy(true);
    try {
      await agendamentosApi.create({
        paciente_id: pacienteId,
        medico_id: medicoId,
        teste_id: testeId,
        empresa_id: empresaId || undefined,
        posto_id: postoId,
        data_prevista: dataPrevista,
        periodo,
        observacoes: observacoes || undefined,
      });
      toast.success('Colheita agendada — kit reservado e processo criado.');
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao agendar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppModal
      title="Novo agendamento"
      onClose={onClose}
      footer={(
        <ModalActions
          onCancel={onClose}
          onSubmit={() => void submit()}
          submitLabel={busy ? 'A agendar…' : 'Agendar'}
          saving={busy}
          submitDisabled={loadingRefs}
        />
      )}
    >
      {loadingRefs ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar…
        </div>
      ) : (
        <div className={FORM.stack}>
          <ModalField label="Paciente" required>
            <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} className={MODAL_INPUT_CLASS}>
              <option value="">Selecionar paciente</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Medico" required>
              <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={MODAL_INPUT_CLASS}>
                <option value="">Selecionar</option>
                {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </ModalField>
            <ModalField label="Teste" required>
              <select value={testeId} onChange={(e) => setTesteId(e.target.value)} className={MODAL_INPUT_CLASS}>
                <option value="">Selecionar</option>
                {testes.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </ModalField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Posto" required>
              <select value={postoId} onChange={(e) => setPostoId(e.target.value)} className={MODAL_INPUT_CLASS}>
                <option value="">Selecionar</option>
                {postos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </ModalField>
            <ModalField label="Periodo" required>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)} className={MODAL_INPUT_CLASS}>
                <option value="Manhã">Manha</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </ModalField>
          </div>

          <ModalField label="Data prevista" required>
            <input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} className={MODAL_INPUT_CLASS} />
          </ModalField>

          <ModalField label="Observacoes">
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={MODAL_INPUT_CLASS} />
          </ModalField>

          <ModalAlert>
            Ao agendar, o sistema verifica stock, reserva um kit e cria o processo automaticamente.
          </ModalAlert>
        </div>
      )}
    </AppModal>
  );
}
