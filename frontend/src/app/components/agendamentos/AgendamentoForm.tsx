import { useEffect, useState } from 'react';
import { X, Loader2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';
import { agendamentosApi } from '../../../lib/api-agendamentos';

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

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Novo agendamento</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
        </div>

        {loadingRefs ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar…</div>
        ) : (
          <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Paciente</label>
              <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} className={inputCls}>
                <option value="">Selecionar paciente</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Medico</label>
                <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)} className={inputCls}>
                  <option value="">Selecionar</option>
                  {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Teste</label>
                <select value={testeId} onChange={(e) => setTesteId(e.target.value)} className={inputCls}>
                  <option value="">Selecionar</option>
                  {testes.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Posto</label>
                <select value={postoId} onChange={(e) => setPostoId(e.target.value)} className={inputCls}>
                  <option value="">Selecionar</option>
                  {postos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Periodo</label>
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)} className={inputCls}>
                  <option value="Manhã">Manha</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Data prevista</label>
              <input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Observacoes</label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={inputCls} />
            </div>
            <p className="text-xs text-slate-400">Ao agendar, o sistema verifica stock, reserva um kit e cria o processo automaticamente.</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />} Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
