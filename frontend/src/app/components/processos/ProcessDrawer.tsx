import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Edit, Trash2, FileText, Send, CheckCircle2, ExternalLink, Loader2, Wallet, Eye, ChevronRight,
} from 'lucide-react';
import { Processo } from '../../data/types';
import { DetailDrawer, DrawerTab } from '../shared/DetailDrawer';
import { Timeline, TimelineStep } from '../shared/Timeline';
import { StatusBadge } from '../shared/StatusBadge';
import { StateTransitionMenu } from './StateTransitionMenu';
import { PROCESS_STATUS_STYLES } from '../../../lib/design-system';
import { formatEUR } from '../../../lib/design-tokens';
import { EstadoProcesso, PIPELINE_ESTADOS, ESTADO_LABEL } from '../../../lib/processos';
import {
  processosApi, FaturacaoProcesso,
} from '../../../lib/api-processos';
import { formatCalendarDatePt } from '../../../lib/dates';
import { ProcessResultadoTab } from './ProcessResultadoTab';

type TabId = 'resumo' | 'workflow' | 'resultado' | 'relatorio' | 'faturacao' | 'trace' | 'historico';

interface ProcessDrawerProps {
  processo: Processo | null;
  open: boolean;
  onClose: () => void;
  onView: (p: Processo) => void;
  onEdit: (p: Processo) => void;
  onDelete: (p: Processo) => void;
  onUpdateEstado: (p: Processo, destino: EstadoProcesso) => Promise<void> | void;
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  renderTrace?: (p: Processo) => React.ReactNode;
}

const fmt = (d?: string | null) => formatCalendarDatePt(d);

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 dark:text-slate-200">{value || '—'}</div>
    </div>
  );
}

function buildTimeline(p: Processo): TimelineStep[] {
  const dates: Partial<Record<EstadoProcesso, string | null | undefined>> = {
    Agendado: p.data_entrada,
    'Kit Reservado': undefined,
    'Colheita Realizada': p.data_colheita,
    'Enviado Laboratorio': p.data_envio_laboratorio || p.data_chegada_laboratorio,
    'Em Analise': p.data_envio_laboratorio,
    'Resultado Disponivel': p.data_resultado,
    Validado: p.data_validacao,
    Faturado: p.fatura_data_emissao,
  };
  if (p.estado === 'Cancelado') {
    return PIPELINE_ESTADOS.map((e) => ({ id: e, label: ESTADO_LABEL[e], date: dates[e], state: 'cancelled' as const }));
  }
  const currentIdx = PIPELINE_ESTADOS.indexOf(p.estado);
  return PIPELINE_ESTADOS.map((e, i) => ({
    id: e,
    label: ESTADO_LABEL[e],
    date: dates[e],
    state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming',
  }));
}

export function ProcessDrawer({
  processo, open, onClose, onView, onEdit, onDelete, onUpdateEstado, onChanged, canUpdate, canDelete, renderTrace,
}: ProcessDrawerProps) {
  const [tab, setTab] = useState<TabId>('resumo');

  if (!processo) return null;

  const tabs: DrawerTab<TabId>[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'resultado', label: 'Resultado' },
    { id: 'relatorio', label: 'Relatorio' },
    { id: 'faturacao', label: 'Faturacao' },
    { id: 'trace', label: 'Rastreio' },
    { id: 'historico', label: 'Historico' },
  ];

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={<span className="font-mono">{processo.numero}</span>}
      subtitle={<span>{processo.paciente_nome} · {processo.teste}</span>}
      headerExtra={
        <div className="flex items-center gap-1">
          <StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} className="px-2 py-0.5" />
          {canUpdate && <button onClick={() => onEdit(processo)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Edit className="w-4 h-4" /></button>}
          {canDelete && <button onClick={() => onDelete(processo)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 className="w-4 h-4" /></button>}
        </div>
      }
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'resumo' && <ResumoTab processo={processo} onView={onView} onUpdateEstado={onUpdateEstado} canUpdate={canUpdate} />}
      {tab === 'workflow' && <WorkflowTab processo={processo} onUpdateEstado={onUpdateEstado} canUpdate={canUpdate} />}
      {tab === 'resultado' && <ProcessResultadoTab processo={processo} canUpdate={canUpdate} onChanged={onChanged} />}
      {tab === 'relatorio' && <RelatorioTab processo={processo} canUpdate={canUpdate} onChanged={onChanged} />}
      {tab === 'faturacao' && <FaturacaoTab processo={processo} canUpdate={canUpdate} onChanged={onChanged} />}
      {tab === 'trace' && (renderTrace ? renderTrace(processo) : <p className="text-sm text-slate-400">Rastreabilidade indisponivel.</p>)}
      {tab === 'historico' && <HistoricoTab processo={processo} />}
    </DetailDrawer>
  );
}

function ResumoTab({
  processo, onView, onUpdateEstado, canUpdate,
}: {
  processo: Processo;
  onView: ProcessDrawerProps['onView'];
  onUpdateEstado: ProcessDrawerProps['onUpdateEstado'];
  canUpdate: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
        <div>
          <div className="text-xs text-slate-400">Estado atual</div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ESTADO_LABEL[processo.estado]}</div>
          {processo.estado === 'Cancelado' && processo.motivo_anulacao_nome && (
            <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              Motivo: {processo.motivo_anulacao_nome}
            </div>
          )}
        </div>
        {canUpdate && (
          <StateTransitionMenu estado={processo.estado} onTransition={(d) => onUpdateEstado(processo, d)} />
        )}
      </div>

      <button
        type="button"
        onClick={() => onView(processo)}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 text-left hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition">
            <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ver ficha do processo</div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              {processo.paciente_nome} · {processo.teste}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 flex-shrink-0 transition" />
      </button>
    </div>
  );
}

function WorkflowTab({ processo, onUpdateEstado, canUpdate }: { processo: Processo; onUpdateEstado: ProcessDrawerProps['onUpdateEstado']; canUpdate: boolean }) {
  return (
    <div className="space-y-5">
      {canUpdate && (
        <div className="flex justify-end">
          <StateTransitionMenu estado={processo.estado} onTransition={(d) => onUpdateEstado(processo, d)} />
        </div>
      )}
      <Timeline steps={buildTimeline(processo)} />
    </div>
  );
}

function RelatorioTab({ processo, canUpdate, onChanged }: { processo: Processo; canUpdate: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [destino, setDestino] = useState<'Medico' | 'Utente' | 'Ambos'>('Medico');

  const gerar = async () => {
    setBusy(true);
    try {
      await processosApi.gerarRelatorio(processo.id);
      toast.success('Relatorio gerado.');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar relatorio.');
    } finally { setBusy(false); }
  };

  const abrir = async () => {
    try { await processosApi.abrirRelatorioHtml(processo.id); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao abrir relatorio.'); }
  };

  const enviar = async () => {
    setBusy(true);
    try {
      await processosApi.enviarRelatorio(processo.id, { destino });
      toast.success(`Relatorio enviado (${destino}).`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar relatorio.');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Relatorio clinico Genoma</div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={gerar} disabled={!canUpdate || busy} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
            <FileText className="w-4 h-4" /> Gerar
          </button>
          <button onClick={abrir} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ExternalLink className="w-4 h-4" /> Pre-visualizar (PDF)
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Envio</div>
        <div className="flex items-center gap-2">
          <select value={destino} onChange={(e) => setDestino(e.target.value as typeof destino)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="Medico">Medico</option>
            <option value="Utente">Utente</option>
            <option value="Ambos">Ambos</option>
          </select>
          <button onClick={enviar} disabled={!canUpdate || busy} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-40">
            <Send className="w-4 h-4" /> Enviar
          </button>
        </div>
        {processo.data_envio_relatorio && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Enviado em {fmt(processo.data_envio_relatorio)} para {processo.relatorio_enviado_para}.</p>
        )}
      </div>
    </div>
  );
}

function FaturacaoTab({ processo, canUpdate, onChanged }: { processo: Processo; canUpdate: boolean; onChanged: () => void }) {
  const [data, setData] = useState<FaturacaoProcesso | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [valorBase, setValorBase] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [recibo, setRecibo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const f = await processosApi.getFaturacao(processo.id);
      setData(f);
      if (f.valor_base) setValorBase(String(f.valor_base));
      if (f.desconto_percentual) setDesconto(String(f.desconto_percentual));
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [processo.id]);

  useEffect(() => { void load(); }, [load]);

  const emitir = async () => {
    setBusy(true);
    try {
      await processosApi.emitirFatura(processo.id, {
        valor_base: valorBase ? Number(valorBase) : undefined,
        desconto_percentual: Number(desconto || 0),
      });
      toast.success('Fatura emitida.');
      onChanged();
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao emitir fatura.'); }
    finally { setBusy(false); }
  };

  const pagar = async () => {
    setBusy(true);
    try {
      await processosApi.registarPagamento(processo.id, { recibo_numero: recibo });
      toast.success('Pagamento registado.');
      onChanged();
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao registar pagamento.'); }
    finally { setBusy(false); }
  };

  if (loading) return <LoadingState />;

  const emitida = data?.fatura_emitida;
  const paga = data?.pago;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <Field label="Estado" value={paga ? 'Paga' : emitida ? 'Emitida (por pagar)' : 'Sem fatura'} />
        <Field label="Nº fatura" value={data?.fatura_numero || '—'} />
        <Field label="Valor final" value={data ? formatEUR(data.valor_final) : '—'} />
        <Field label="Recibo" value={data?.recibo_numero || '—'} />
      </div>

      {!emitida && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Emitir fatura</div>
          <div className="flex items-center gap-2">
            <input value={valorBase} onChange={(e) => setValorBase(e.target.value)} type="number" placeholder="Valor base (€)" className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <input value={desconto} onChange={(e) => setDesconto(e.target.value)} type="number" placeholder="Desc %" className="w-24 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <button onClick={emitir} disabled={!canUpdate || busy || processo.estado !== 'Validado'} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Emitir fatura
          </button>
          {processo.estado !== 'Validado' && <p className="text-xs text-amber-600 dark:text-amber-400">So e possivel faturar processos validados.</p>}
        </div>
      )}

      {emitida && !paga && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Registar pagamento</div>
          <div className="flex items-center gap-2">
            <input value={recibo} onChange={(e) => setRecibo(e.target.value)} placeholder="Nº de recibo" className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <button onClick={pagar} disabled={!canUpdate || busy || !recibo.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40">
              <CheckCircle2 className="w-4 h-4" /> Marcar como paga
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricoTab({ processo }: { processo: Processo }) {
  const eventos: TimelineStep[] = [
    { id: 'entrada', label: 'Entrada / agendamento', date: processo.data_entrada, state: 'done' },
    { id: 'colheita', label: 'Colheita realizada', date: processo.data_colheita, state: processo.data_colheita ? 'done' : 'upcoming' },
    { id: 'lab', label: 'Chegada ao laboratorio', date: processo.data_chegada_laboratorio, state: processo.data_chegada_laboratorio ? 'done' : 'upcoming' },
    { id: 'resultado', label: 'Resultado disponivel', date: processo.data_resultado, state: processo.data_resultado ? 'done' : 'upcoming' },
    { id: 'validacao', label: 'Validacao clinica', date: processo.data_validacao, state: processo.data_validacao ? 'done' : 'upcoming' },
    { id: 'envio', label: 'Envio de relatorio', date: processo.data_envio_relatorio, state: processo.data_envio_relatorio ? 'done' : 'upcoming' },
    { id: 'fatura', label: 'Fatura emitida', date: processo.fatura_data_emissao, state: processo.fatura_emitida ? 'done' : 'upcoming' },
    { id: 'pagamento', label: 'Pagamento', date: processo.pagamento_data, state: processo.pagamento_data ? 'done' : 'upcoming' },
  ];
  return <Timeline steps={eventos.filter((e) => e.date || e.state === 'done')} dense />;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar…
    </div>
  );
}
