import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { mapProcessDrawerTabToFormTab, withRecordQuery } from '../../lib/record-tabs';
import { LayoutGrid, Table2, FolderOpen, Ban, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { PAGE, PANEL, CONTROL } from '../../lib/design-tokens';
import { Processo } from '../data/types';
import { PageHeader } from './shared/PageHeader';
import { ViewModeToggle } from './shared/SlidingTabs';
import { ReadOnlyNotice } from './shared/ReadOnlyNotice';
import { EmptyState } from './shared/EmptyState';
import { FilterBar } from './shared/FilterBar';
import { BulkActionBar } from './shared/BulkActionBar';
import { ProcessKpis, ProcessKpiId } from './processos/ProcessKpis';
import { ProcessPipeline } from './processos/ProcessPipeline';
import { ProcessTable } from './processos/ProcessTable';
import { ProcessDrawer } from './processos/ProcessDrawer';
import { CancelProcessoDialog } from './processos/CancelProcessoDialog';
import { TraceView } from './shared/TraceView';
import {
  EstadoProcesso, PROCESSOS_PAGE_ESTADOS, PROCESS_PIPELINE_COLUMNS, ESTADO_LABEL,
  processoMatchesEstadoFilter, isAtivo, isAtrasado, isResultadoPorValidar,
  isRelatorioPorEnviar, isFaturaPorEmitir, isAntigo, resolveDataConclusao, proximosEstados,
} from '../../lib/processos';
import { canManageProcessoOperacional } from '../../lib/processo-access';
import { isProcessoLaboratorio } from '../../lib/contactos';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useConfirmAction } from '../context/ConfirmActionContext';
import { notifyError, notifySuccess } from '../../lib/toast';

const isHoje = (d?: string) => {
  if (!d) return false;
  const t = new Date(d); const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
};

const KPI_PREDICATE: Record<ProcessKpiId, (p: Processo) => boolean> = {
  ativos: isAtivo,
  antigos: isAntigo,
  colheitas_hoje: (p) => isHoje(p.data_colheita),
  por_validar: isResultadoPorValidar,
  a_faturar: isFaturaPorEmitir,
  relatorios: isRelatorioPorEnviar,
  atrasados: (p) => isAtrasado(p),
  tat: () => true,
};

export function ProcessesPage() {
  const { processos, contacts, updateProcesso, deleteProcesso, refreshProcessos, motivosAnulacao } = useData();
  const { hasPermission, role } = useAuth();
  const { t } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const confirmAction = useConfirmAction();
  const navigate = useNavigate();
  const canCreate = hasPermission('processos', 'create');
  const canUpdate = canManageProcessoOperacional(role, hasPermission);
  const canDelete = hasPermission('processos', 'delete');
  const isMedico = role === 'Medico';

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [postoFilter, setPostoFilter] = useState('');
  const [medicoFilter, setMedicoFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [kpiFilter, setKpiFilter] = useState<ProcessKpiId | null>(null);
  const effectiveKpiFilter = isMedico ? (kpiFilter ?? 'ativos') : kpiFilter;
  const [view, setView] = useState<'table' | 'pipeline'>('pipeline');

  useEffect(() => {
    if (isMedico && effectiveKpiFilter === 'antigos') {
      setView('table');
    }
  }, [isMedico, effectiveKpiFilter]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerProcesso, setDrawerProcesso] = useState<Processo | null>(null);
  const [cancelTargets, setCancelTargets] = useState<Processo[]>([]);

  const processosLaboratorio = useMemo(
    () => processos.filter((p) => isProcessoLaboratorio(p.estado)),
    [processos],
  );

  const medicos = useMemo(() => [...new Set(processosLaboratorio.map((p) => p.medico).filter(Boolean))], [processosLaboratorio]);
  const postos = useMemo(() => [...new Set(processosLaboratorio.map((p) => p.posto).filter(Boolean))], [processosLaboratorio]);

  const nifByPaciente = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => map.set(c.id, c.nif || ''));
    return map;
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = processosLaboratorio.filter((p) => {
      const matchSearch = !q || [
        p.numero, p.paciente_nome, p.medico, p.kit_codigo, p.teste, nifByPaciente.get(p.paciente_id),
      ].some((f) => (f || '').toLowerCase().includes(q));
      const matchEstado = !estadoFilter || processoMatchesEstadoFilter(p.estado, estadoFilter);
      const matchPosto = !postoFilter || p.posto === postoFilter;
      const matchMedico = !medicoFilter || p.medico === medicoFilter;
      const matchInicio = !dataInicio || p.data_entrada >= dataInicio;
      const matchFim = !dataFim || p.data_entrada <= dataFim;
      const matchKpi = !effectiveKpiFilter || KPI_PREDICATE[effectiveKpiFilter](p);
      return matchSearch && matchEstado && matchPosto && matchMedico && matchInicio && matchFim && matchKpi;
    });

    if (effectiveKpiFilter === 'antigos') {
      return [...rows].sort((a, b) => (resolveDataConclusao(b) || '').localeCompare(resolveDataConclusao(a) || ''));
    }
    return rows;
  }, [processosLaboratorio, search, estadoFilter, postoFilter, medicoFilter, dataInicio, dataFim, effectiveKpiFilter, nifByPaciente]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  const advancedCount = [postoFilter, medicoFilter, dataInicio, dataFim].filter(Boolean).length;

  const resetPage = () => setPage(1);

  const openView = (p: Processo) => {
    setDrawerProcesso(null);
    navigate(`/processos/${p.id}`);
  };

  const openEdit = (p: Processo, drawerTab?: string) => {
    setDrawerProcesso(null);
    const formTab = drawerTab ? mapProcessDrawerTabToFormTab(drawerTab) : undefined;
    navigate(withRecordQuery(`/processos/${p.id}`, { tab: formTab, edit: true }));
  };

  const handleDelete = async (p: Processo) => {
    if (!(await confirmDelete(deleteTargetLabel('o processo', p.numero)))) return;
    try {
      await deleteProcesso(p.id);
      notifySuccess(t('pages.processes.deleted', { numero: p.numero }));
      setDrawerProcesso((prev) => (prev?.id === p.id ? null : prev));
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    }
  };

  const handleTransition = async (p: Processo, destino: EstadoProcesso) => {
    if (!canUpdate) return;
    if (destino === 'Cancelado') {
      setCancelTargets([p]);
      return;
    }
    if (needsTransitionConfirm(destino)) {
      const ok = await confirmAction({
        title: t('ux.confirmAction.transitionTitle'),
        message: t('ux.confirmAction.transitionMessage', {
          numero: p.numero,
          estado: ESTADO_LABEL[destino],
        }),
      });
      if (!ok) return;
    }
    try {
      await updateProcesso(p.id, { estado: destino });
      setDrawerProcesso((prev) => (prev?.id === p.id ? { ...prev, estado: destino } : prev));
      notifySuccess(`${p.numero} → ${ESTADO_LABEL[destino]}`);
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    }
  };

  const confirmCancel = async (motivoId: string) => {
    let ok = 0;
    for (const p of cancelTargets) {
      try {
        await updateProcesso(p.id, { estado: 'Cancelado', motivo_anulacao_id: motivoId });
        ok += 1;
        setDrawerProcesso((prev) => (prev?.id === p.id ? { ...prev, estado: 'Cancelado', motivo_anulacao_id: motivoId } : prev));
      } catch {
        /* skip */
      }
    }
    notifySuccess(ok === 1 ? t('pages.processes.form.cancelled') : `${ok}/${cancelTargets.length} processos cancelados.`);
    setCancelTargets([]);
    clearSelection();
  };

  const toggle = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds((prev) => {
    if (paginated.every((p) => prev.has(p.id))) {
      const next = new Set(prev); paginated.forEach((p) => next.delete(p.id)); return next;
    }
    const next = new Set(prev); paginated.forEach((p) => next.add(p.id)); return next;
  });
  const clearSelection = () => setSelectedIds(new Set());

  const selectedProcessos = processosLaboratorio.filter((p) => selectedIds.has(p.id));
  const sharedEstado = selectedProcessos.length > 0 && selectedProcessos.every((p) => p.estado === selectedProcessos[0].estado)
    ? selectedProcessos[0].estado : null;
  const bulkNext = sharedEstado ? proximosEstados(sharedEstado).filter((e) => e !== 'Cancelado') : [];

  const bulkTransition = async (destino: EstadoProcesso) => {
    const targets = [...selectedProcessos];
    if (needsTransitionConfirm(destino)) {
      const ok = await confirmAction({
        title: t('ux.confirmAction.transitionTitle'),
        message: t('ux.confirmAction.bulkTransitionMessage', {
          count: targets.length,
          estado: ESTADO_LABEL[destino],
        }),
      });
      if (!ok) return;
    }
    let ok = 0;
    for (const p of targets) {
      try { await updateProcesso(p.id, { estado: destino }); ok += 1; } catch { /* skip invalid */ }
    }
    notifySuccess(`${ok}/${targets.length} processos atualizados.`);
    clearSelection();
  };

  const bulkCancel = () => {
    if (selectedProcessos.length === 0) return;
    setCancelTargets(selectedProcessos);
  };

  const estadoChips = PROCESSOS_PAGE_ESTADOS.map((e) => {
    const column = PROCESS_PIPELINE_COLUMNS.find((c) => c.key === e.key);
    const label = column?.label ?? ESTADO_LABEL[e.estados[0] as EstadoProcesso] ?? e.key;
    return {
      id: e.key,
      label,
      count: processosLaboratorio.filter((p) => e.estados.includes(p.estado)).length,
      tone: e.key === 'Cancelado' ? ('danger' as const) : ('brand' as const),
    };
  });

  const currentDrawer = drawerProcesso ? processosLaboratorio.find((p) => p.id === drawerProcesso.id) || drawerProcesso : null;

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader
          title={t('pages.processes.title')}
          subtitle={t('pages.processes.subtitle')}
        />

        {!canCreate && !canUpdate && !canDelete && <ReadOnlyNotice />}

        <FilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); resetPage(); }}
          searchPlaceholder={t('pages.processes.searchPlaceholder')}
          chips={estadoChips}
          activeChipId={estadoFilter || undefined}
          onChipClick={(id) => { setEstadoFilter(id); resetPage(); }}
          advancedCount={advancedCount}
          onClearAdvanced={() => { setPostoFilter(''); setMedicoFilter(''); setDataInicio(''); setDataFim(''); resetPage(); }}
          advanced={
            <div className="space-y-2">
              <select value={postoFilter} onChange={(e) => { setPostoFilter(e.target.value); resetPage(); }} className={CONTROL.input}>
                <option value="">Todos os postos</option>
                {postos.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={medicoFilter} onChange={(e) => { setMedicoFilter(e.target.value); resetPage(); }} className={CONTROL.input}>
                <option value="">Todos os medicos</option>
                {medicos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); resetPage(); }} className={`${CONTROL.input} flex-1`} />
                <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); resetPage(); }} className={`${CONTROL.input} flex-1`} />
              </div>
            </div>
          }
          right={
            <ViewModeToggle
              value={view}
              onChange={setView}
              items={[
                { id: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
                { id: 'table', label: 'Tabela', icon: Table2 },
              ]}
            />
          }
        />

        {view === 'pipeline' ? (
          <ProcessPipeline
            processos={filtered}
            onOpen={setDrawerProcesso}
            onTransition={handleTransition}
            canUpdate={canUpdate}
            columnFilter={estadoFilter || undefined}
          />
        ) : (
          <div className={PANEL.table}>
            {paginated.length === 0 ? (
              <EmptyState icon={FolderOpen} title="Sem processos" description="Ajuste os filtros ou crie processos a partir dos contactos." />
            ) : (
              <>
                <ProcessTable
                  processos={paginated}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                  onOpen={setDrawerProcesso}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <span className="text-xs text-slate-400">{start + 1}–{Math.min(start + itemsPerPage, filtered.length)} de {filtered.length}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Anterior</button>
                    <span className="text-xs text-slate-500 px-2">{safePage}/{totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Seguinte</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <ProcessKpis
          processos={processosLaboratorio}
          activeKpi={effectiveKpiFilter}
          medicoView={isMedico}
          onSelect={(id) => {
            if (isMedico) {
              setKpiFilter(id);
            } else {
              setKpiFilter((prev) => (prev === id ? null : id));
            }
            resetPage();
          }}
        />
      </div>

      {canUpdate && (
        <BulkActionBar count={selectedIds.size} onClear={clearSelection}>
          {bulkNext.map((d) => (
            <button key={d} onClick={() => bulkTransition(d)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition">
              <ArrowRight className="w-3.5 h-3.5" /> {ESTADO_LABEL[d]}
            </button>
          ))}
          <button onClick={bulkCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-700 hover:bg-rose-600 text-white transition">
            <Ban className="w-3.5 h-3.5" /> Cancelar
          </button>
        </BulkActionBar>
      )}

      <ProcessDrawer
        processo={currentDrawer}
        open={!!currentDrawer}
        onClose={() => setDrawerProcesso(null)}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        onUpdateEstado={handleTransition}
        onChanged={() => { void refreshProcessos(); }}
        canUpdate={canUpdate}
        canDelete={canDelete}
        renderTrace={(p) => <TraceView tipo="processo" id={p.id} />}
      />

      <CancelProcessoDialog
        processo={cancelTargets[0] ?? null}
        bulkCount={cancelTargets.length > 1 ? cancelTargets.length : undefined}
        motivos={motivosAnulacao}
        onClose={() => setCancelTargets([])}
        onConfirm={confirmCancel}
      />

    </div>
  );
}
