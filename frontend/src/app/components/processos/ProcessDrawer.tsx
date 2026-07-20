import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Edit, Trash2, FileText, Send, CheckCircle2, ExternalLink, Loader2, Wallet, Eye, X,
  LayoutDashboard, GitBranch, FlaskConical, Receipt, Link2, History, User,
} from 'lucide-react';
import { Processo } from '../../data/types';
import { DetailDrawer, DrawerTab } from '../shared/DetailDrawer';
import {
  DrawerActionCard,
  DrawerEmpty,
  DrawerField,
  DrawerFieldGrid,
  DrawerLoading,
  DrawerPanel,
  DrawerPanelContent,
  DrawerPanelHeader,
  DrawerStatusBanner,
  DrawerTabBody,
} from '../shared/DrawerTabLayout';
import { Timeline } from '../shared/Timeline';
import { StatusBadge } from '../shared/StatusBadge';
import { StateTransitionMenu } from './StateTransitionMenu';
import { PROCESS_STATUS_STYLES } from '../../../lib/design-system';
import { CONTROL, DRAWER, formatEUR, MODAL } from '../../../lib/design-tokens';
import { EstadoProcesso, buildProcessHistoricoSteps, buildProcessWorkflowSteps, ESTADO_LABEL } from '../../../lib/processos';
import { processosApi, FaturacaoProcesso, AnexoProcesso } from '../../../lib/api-processos';
import { downloadAnexoFile } from '../../../lib/api';
import { formatCalendarDatePt } from '../../../lib/dates';
import { ProcessResultadoTab } from './ProcessResultadoTab';
import { ProcessDataQualityBanner } from '../shared/ProcessDataQualityBanner';
import { FormRadixSelect } from '../shared/FormPageChrome';
import { useAuth } from '../../context/AuthContext';
import { canManageProcessoOperacional } from '../../../lib/processo-access';
import { RelatorioPreviewFrame } from '../shared/RelatorioPreviewFrame';

type TabId = 'resumo' | 'workflow' | 'resultado' | 'relatorio' | 'faturacao' | 'trace' | 'historico';

interface ProcessDrawerProps {
  processo: Processo | null;
  open: boolean;
  onClose: () => void;
  onView: (p: Processo) => void;
  onEdit: (p: Processo, drawerTab?: string) => void;
  onDelete: (p: Processo) => void;
  onUpdateEstado: (p: Processo, destino: EstadoProcesso) => Promise<void> | void;
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  renderTrace?: (p: Processo) => React.ReactNode;
}

const fmt = (d?: string | null) => formatCalendarDatePt(d);

const DESTINO_OPTIONS = [
  { value: 'Medico', label: 'Médico' },
  { value: 'Utente', label: 'Utente' },
  { value: 'Ambos', label: 'Ambos' },
];

const PROCESS_DRAWER_TABS: DrawerTab<TabId>[] = [
  { id: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },
  { id: 'resultado', label: 'Resultado', icon: FlaskConical },
  { id: 'relatorio', label: 'Relatório', icon: FileText },
  { id: 'faturacao', label: 'Faturação', icon: Receipt },
  { id: 'trace', label: 'Rastreio', icon: Link2 },
  { id: 'historico', label: 'Histórico', icon: History },
];

function DrawerTabPane({
  tabId,
  activeTab,
  isLoaded,
  children,
}: {
  tabId: TabId;
  activeTab: TabId;
  isLoaded: boolean;
  children: React.ReactNode;
}) {
  if (!isLoaded) return null;
  return (
    <div className={activeTab === tabId ? 'block' : 'hidden'} aria-hidden={activeTab !== tabId}>
      {children}
    </div>
  );
}

const MEDICO_HIDDEN_TABS = new Set<TabId>(['faturacao', 'trace']);

const drawerTabsForRole = (role: string): DrawerTab<TabId>[] =>
  role === 'Medico'
    ? PROCESS_DRAWER_TABS.filter((t) => !MEDICO_HIDDEN_TABS.has(t.id))
    : PROCESS_DRAWER_TABS;

export function ProcessDrawer({
  processo, open, onClose, onView, onEdit, onDelete, onUpdateEstado, onChanged, canUpdate, canDelete, renderTrace,
}: ProcessDrawerProps) {
  const { role, hasPermission } = useAuth();
  const canWriteProcesso = canManageProcessoOperacional(role, hasPermission);
  const [tab, setTab] = useState<TabId>('resumo');
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(() => new Set(['resumo']));

  useEffect(() => {
    if (!processo) return;
    setTab('resumo');
    setLoadedTabs(new Set(['resumo']));
  }, [processo?.id]);

  useEffect(() => {
    const allowedIds = new Set(drawerTabsForRole(role).map((t) => t.id));
    if (!allowedIds.has(tab)) setTab('resumo');
  }, [role, tab]);

  useEffect(() => {
    setLoadedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);

  if (!processo) return null;

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      width="compact"
      instantTabs
      title={<span className="font-mono text-[15px]">{processo.numero}</span>}
      subtitle={<span>{processo.paciente_nome} · {processo.teste}</span>}
      headerExtra={
        <div className="flex items-center gap-1">
          <StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} className="px-2 py-0.5" />
          {canWriteProcesso && (
            <button type="button" onClick={() => onEdit(processo, tab)} className={MODAL.closeBtn} title="Editar">
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => onDelete(processo)} className={`${MODAL.closeBtn} text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20`} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      }
      tabs={drawerTabsForRole(role)}
      activeTab={tab}
      onTabChange={setTab}
    >
      <DrawerTabPane tabId="resumo" activeTab={tab} isLoaded={loadedTabs.has('resumo')}>
        <ResumoTab processo={processo} onView={onView} onUpdateEstado={onUpdateEstado} canUpdate={canWriteProcesso} />
      </DrawerTabPane>
      <DrawerTabPane tabId="workflow" activeTab={tab} isLoaded={loadedTabs.has('workflow')}>
        <WorkflowTab processo={processo} onUpdateEstado={onUpdateEstado} canUpdate={canWriteProcesso} />
      </DrawerTabPane>
      <DrawerTabPane tabId="resultado" activeTab={tab} isLoaded={loadedTabs.has('resultado')}>
        <ProcessResultadoTab processo={processo} canUpdate={canWriteProcesso} onChanged={onChanged} variant="drawer" />
      </DrawerTabPane>
      <DrawerTabPane tabId="relatorio" activeTab={tab} isLoaded={loadedTabs.has('relatorio')}>
        <RelatorioTab processo={processo} canUpdate={canWriteProcesso} onChanged={onChanged} />
      </DrawerTabPane>
      <DrawerTabPane tabId="faturacao" activeTab={tab} isLoaded={loadedTabs.has('faturacao')}>
        <FaturacaoTab processo={processo} canUpdate={canUpdate} onChanged={onChanged} />
      </DrawerTabPane>
      <DrawerTabPane tabId="trace" activeTab={tab} isLoaded={loadedTabs.has('trace')}>
        <TraceTab processo={processo} renderTrace={renderTrace} />
      </DrawerTabPane>
      <DrawerTabPane tabId="historico" activeTab={tab} isLoaded={loadedTabs.has('historico')}>
        <HistoricoTab processo={processo} />
      </DrawerTabPane>
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
    <DrawerTabBody>
      <ProcessDataQualityBanner processo={processo} />
      <DrawerStatusBanner
        label="Estado actual"
        value={ESTADO_LABEL[processo.estado]}
        hint={processo.estado === 'Cancelado' && processo.motivo_anulacao_nome ? `Motivo: ${processo.motivo_anulacao_nome}` : undefined}
        action={canUpdate ? <StateTransitionMenu estado={processo.estado} onTransition={(d) => onUpdateEstado(processo, d)} /> : undefined}
      />

      <DrawerPanel>
        <DrawerPanelHeader title="Identificação" icon={User} />
        <DrawerPanelContent>
          <DrawerFieldGrid>
            <DrawerField label="Paciente" value={processo.paciente_nome} />
            <DrawerField label="Teste" value={processo.teste} />
            <DrawerField label="Médico" value={processo.medico} />
            <DrawerField label="Posto" value={processo.posto} />
            <DrawerField label="Kit" value={processo.kit_codigo || processo.numero} mono />
            <DrawerField label="Colheita" value={fmt(processo.data_colheita)} />
          </DrawerFieldGrid>
        </DrawerPanelContent>
      </DrawerPanel>

      <DrawerActionCard
        title="Ver ficha do processo"
        subtitle={`${processo.paciente_nome} · ${processo.teste}`}
        icon={Eye}
        onClick={() => onView(processo)}
      />
    </DrawerTabBody>
  );
}

function WorkflowTab({ processo, onUpdateEstado, canUpdate }: { processo: Processo; onUpdateEstado: ProcessDrawerProps['onUpdateEstado']; canUpdate: boolean }) {
  return (
    <DrawerTabBody>
      <DrawerPanel>
        <DrawerPanelHeader
          title="Percurso do processo"
          icon={GitBranch}
          subtitle="Estados concluídos, actual e próximas etapas"
          action={canUpdate ? <StateTransitionMenu estado={processo.estado} onTransition={(d) => onUpdateEstado(processo, d)} size="sm" /> : undefined}
        />
        <DrawerPanelContent>
          <Timeline steps={buildProcessWorkflowSteps(processo)} />
        </DrawerPanelContent>
      </DrawerPanel>
    </DrawerTabBody>
  );
}

function RelatorioTab({ processo, canUpdate, onChanged }: { processo: Processo; canUpdate: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [destino, setDestino] = useState<'Medico' | 'Utente' | 'Ambos'>('Medico');
  const [anexos, setAnexos] = useState<AnexoProcesso[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(true);

  const loadAnexos = useCallback(async () => {
    setLoadingAnexos(true);
    try {
      const todos = await processosApi.listRelatoriosAnexos(processo.id);
      setAnexos(todos.filter((a) => a.titulo?.startsWith('Relatório #') || a.url?.includes('Relatorio_')));
    } catch (e) {
      setAnexos([]);
      const msg = e instanceof Error ? e.message : 'Falha ao carregar relatórios guardados.';
      if (!msg.includes('Sem permiss')) toast.error(msg);
    } finally {
      setLoadingAnexos(false);
    }
  }, [processo.id]);

  useEffect(() => { void loadAnexos(); }, [loadAnexos]);

  const gerar = async () => {
    setBusy(true);
    try {
      const res = await processosApi.gerarRelatorio(processo.id);
      if (res.skipped) {
        toast.info('Relatório inalterado — o PDF mais recente já reflecte estes dados.');
      } else {
        toast.success(res.anexo?.titulo ? `${res.anexo.titulo} guardado nos anexos.` : 'Relatório gerado.');
      }
      onChanged?.();
      await loadAnexos();
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'Falha ao gerar relatório.';
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const abrir = async () => {
    setLoadingPreview(true);
    try {
      const html = await processosApi.fetchRelatorioHtml(processo.id);
      setPreviewHtml(html);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao abrir relatório.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const enviar = async () => {
    setBusy(true);
    try {
      await processosApi.enviarRelatorio(processo.id, { destino });
      toast.success(`Relatório enviado (${destino}).`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar relatório.');
    } finally { setBusy(false); }
  };

  return (
    <>
    <DrawerTabBody>
      <DrawerPanel>
        <DrawerPanelHeader title="Relatório de resultados" icon={FileText} subtitle="Layout Maternity — Proposta 1 (cliente)" />
        <DrawerPanelContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <button type="button" onClick={gerar} disabled={busy} className={CONTROL.buttonPrimary}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Gerar PDF
              </button>
            )}
            <button type="button" onClick={abrir} disabled={loadingPreview} className={CONTROL.buttonSecondary}>
              {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Pré-visualizar HTML
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canUpdate
              ? 'Ao validar o resultado, o PDF é gerado automaticamente (se os dados tiverem alterado).'
              : 'Consulta do relatório clínico. A geração e envio são feitos pela equipa administrativa.'}
          </p>
        </DrawerPanelContent>
      </DrawerPanel>

      <DrawerPanel>
        <DrawerPanelHeader title="Versões guardadas" icon={FileText} />
        <DrawerPanelContent className="space-y-2">
          {loadingAnexos ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
            </div>
          ) : anexos.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum relatório PDF guardado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {anexos.map((anexo) => (
                <li key={anexo.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{anexo.titulo}</div>
                    {anexo.descricao && (
                      <div className="truncate text-xs text-slate-500">{anexo.descricao}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void downloadAnexoFile(anexo.id, anexo.titulo)}
                    className={`${CONTROL.buttonSecondary} shrink-0`}
                  >
                    <ExternalLink className="h-4 w-4" /> PDF
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DrawerPanelContent>
      </DrawerPanel>

      {canUpdate ? (
        <DrawerPanel>
          <DrawerPanelHeader title="Envio" icon={Send} />
          <DrawerPanelContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <div className={DRAWER.fieldLabel}>Destinatário</div>
                <FormRadixSelect
                  value={destino}
                  onChange={(v) => setDestino(v as typeof destino)}
                  options={DESTINO_OPTIONS}
                />
              </div>
              <button type="button" onClick={enviar} disabled={busy} className={`${CONTROL.buttonSecondary} shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/20`}>
                <Send className="h-4 w-4" /> Enviar
              </button>
            </div>
            {processo.data_envio_relatorio && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Enviado em {fmt(processo.data_envio_relatorio)} para {processo.relatorio_enviado_para}.
              </p>
            )}
          </DrawerPanelContent>
        </DrawerPanel>
      ) : processo.data_envio_relatorio ? (
        <DrawerPanel>
          <DrawerPanelHeader title="Envio" icon={Send} />
          <DrawerPanelContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Enviado em {fmt(processo.data_envio_relatorio)} para {processo.relatorio_enviado_para}.
            </p>
          </DrawerPanelContent>
        </DrawerPanel>
      ) : null}
    </DrawerTabBody>

    {previewHtml
      ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-3 pb-5 pt-20 dark:bg-black/60 sm:px-5"
          style={{ fontFamily: 'Inter, sans-serif' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="relatorio-preview-title"
          onClick={() => setPreviewHtml(null)}
        >
          <div
            className="flex h-[min(calc(100vh-4rem),920px)] w-[min(860px,98vw)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 ${MODAL.headerBorder}`}>
              <div className="min-w-0">
                <h2 id="relatorio-preview-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Pré-visualização do relatório
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{processo.numero}</p>
              </div>
              <button type="button" onClick={() => setPreviewHtml(null)} className={MODAL.closeBtn} aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <RelatorioPreviewFrame html={previewHtml} />
          </div>
        </div>,
        document.body,
      )
      : null}
    </>
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

  if (loading) return <DrawerLoading label="A carregar faturação…" />;

  const emitida = data?.fatura_emitida;
  const paga = data?.pago;

  return (
    <DrawerTabBody>
      <DrawerPanel>
        <DrawerPanelHeader title="Resumo financeiro" icon={Wallet} />
        <DrawerPanelContent>
          <DrawerFieldGrid>
            <DrawerField label="Estado" value={paga ? 'Paga' : emitida ? 'Emitida (por pagar)' : 'Sem fatura'} />
            <DrawerField label="Nº fatura" value={data?.fatura_numero} mono />
            <DrawerField label="Valor final" value={data ? formatEUR(data.valor_final) : '—'} />
            <DrawerField label="Recibo" value={data?.recibo_numero} mono />
          </DrawerFieldGrid>
        </DrawerPanelContent>
      </DrawerPanel>

      {!emitida && (
        <DrawerPanel>
          <DrawerPanelHeader title="Emitir fatura" icon={Receipt} />
          <DrawerPanelContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={valorBase} onChange={(e) => setValorBase(e.target.value)} type="number" placeholder="Valor base (€)" className={`${CONTROL.input} flex-1`} />
              <input value={desconto} onChange={(e) => setDesconto(e.target.value)} type="number" placeholder="Desc. %" className={`${CONTROL.input} w-full sm:w-28`} />
            </div>
            <button type="button" onClick={emitir} disabled={!canUpdate || busy || processo.estado !== 'Validado'} className={CONTROL.buttonPrimary}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Emitir fatura
            </button>
            {processo.estado !== 'Validado' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Só é possível faturar processos validados.</p>
            )}
          </DrawerPanelContent>
        </DrawerPanel>
      )}

      {emitida && !paga && (
        <DrawerPanel>
          <DrawerPanelHeader title="Registar pagamento" icon={CheckCircle2} />
          <DrawerPanelContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={recibo} onChange={(e) => setRecibo(e.target.value)} placeholder="Nº de recibo" className={`${CONTROL.input} flex-1`} />
              <button type="button" onClick={pagar} disabled={!canUpdate || busy || !recibo.trim()} className={`${CONTROL.buttonSecondary} shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20`}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como paga
              </button>
            </div>
          </DrawerPanelContent>
        </DrawerPanel>
      )}
    </DrawerTabBody>
  );
}

function TraceTab({ processo, renderTrace }: { processo: Processo; renderTrace?: ProcessDrawerProps['renderTrace'] }) {
  return (
    <DrawerTabBody>
      <DrawerPanel>
        <DrawerPanelHeader title="Cadeia de rastreabilidade" icon={Link2} subtitle="Lote · Kit · Processo · Resultado" />
        <DrawerPanelContent>
          {renderTrace ? renderTrace(processo) : <DrawerEmpty message="Rastreabilidade indisponível para este processo." />}
        </DrawerPanelContent>
      </DrawerPanel>
    </DrawerTabBody>
  );
}

function HistoricoTab({ processo }: { processo: Processo }) {
  const steps = buildProcessHistoricoSteps(processo);
  return (
    <DrawerTabBody>
      <DrawerPanel>
        <DrawerPanelHeader title="Linha temporal" icon={History} subtitle="Eventos registados por ordem cronológica" />
        <DrawerPanelContent>
          {steps.length === 0 ? (
            <DrawerEmpty message="Sem eventos registados neste processo." />
          ) : (
            <Timeline steps={steps} dense />
          )}
        </DrawerPanelContent>
      </DrawerPanel>
    </DrawerTabBody>
  );
}
