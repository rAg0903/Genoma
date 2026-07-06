import { useMemo, useState } from 'react';
import { Trash2, ArrowRight, X, Undo2, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Kit, RequisicaoKit } from '../../data/types';
import { EmptyState } from '../shared/EmptyState';
import { StatusBadge } from '../shared/StatusBadge';
import { MinDatePicker } from '../shared/MinDatePicker';
import { AppModal, ModalActions, ModalAlert } from '../shared/AppModal';
import { formatRequisicaoLocationLabel, isRequisicaoDescarte } from '../../../lib/stock-locations';
import { PANEL, CONTROL, FORM } from '../../../lib/design-tokens';
import { SearchField } from '../shared/PageToolbar';
import { formatCalendarDatePt, normalizeCalendarDate } from '../../../lib/dates';
import { useLanguage } from '../../../i18n/LanguageContext';

const REQUISICAO_STATUS_STYLES: Record<string, string> = {
  Entregue: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Cancelada: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const canRevertKitAtLab = (kitId: string, kits: Kit[]) => {
  const kit = kits.find((k) => k.id === kitId);
  return kit?.fase_ciclo === 'em_lab_final' && kit.localizacao === 'Laboratorio';
};

interface DescartesTabProps {
  requisicoes: RequisicaoKit[];
  kits: Kit[];
  canUpdate: boolean;
  onRevertKit: (kitId: string, observacoes?: string) => Promise<void>;
  finalLabIds?: string[];
  featureHealthLabId?: string;
}

export function DescartesTab({
  requisicoes,
  kits,
  canUpdate,
  onRevertKit,
  finalLabIds,
  featureHealthLabId,
}: DescartesTabProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [kitPickerTarget, setKitPickerTarget] = useState<{
    requisicao: RequisicaoKit;
    kitIds: string[];
  } | null>(null);
  const [pendingRevert, setPendingRevert] = useState<{
    requisicao: RequisicaoKit;
    kitId: string;
  } | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [busy, setBusy] = useState(false);

  const labFilter = finalLabIds?.length
    ? finalLabIds
    : (featureHealthLabId ? [featureHealthLabId] : undefined);

  const descartes = useMemo(
    () => requisicoes.filter((r) => isRequisicaoDescarte(r, labFilter)),
    [requisicoes, labFilter],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const dateIso = normalizeCalendarDate(dateFilter);
    return descartes.filter((r) => {
      if (dateIso && normalizeCalendarDate(r.data) !== dateIso) return false;
      if (!q) return true;
      return [
        r.numero_envio,
        r.utilizador_nome,
        r.origem,
        r.destino,
        r.origem_nome,
        r.destino_nome,
        r.tracking_number,
      ].some((f) => (f || '').toLowerCase().includes(q));
    });
  }, [descartes, search, dateFilter]);

  const kitById = (kitId: string) => kits.find((k) => k.id === kitId);

  const kitLabel = (kitId: string) =>
    kitById(kitId)?.codigo_barras || kitId.slice(0, 8);

  const revertableKitIds = (r: RequisicaoKit) =>
    (r.kit_ids || []).filter((id) => canRevertKitAtLab(id, kits));

  const openRevertFlow = (requisicao: RequisicaoKit, kitIds: string[]) => {
    setObservacoes('');
    if (kitIds.length === 1) {
      setPendingRevert({ requisicao, kitId: kitIds[0] });
      return;
    }
    setKitPickerTarget({ requisicao, kitIds });
  };

  const handleConfirmRevert = async () => {
    if (!pendingRevert) return;
    setBusy(true);
    try {
      await onRevertKit(pendingRevert.kitId, observacoes.trim() || undefined);
      toast.success(t('stocks.revertDescarte.success', { kit: kitLabel(pendingRevert.kitId) }));
      setPendingRevert(null);
      setObservacoes('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.operationFailed'));
    } finally {
      setBusy(false);
    }
  };

  const dateInputClass = CONTROL.input;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={t('stocks.searchDescartes')}
        />
        <div className="flex w-full shrink-0 items-center gap-1 sm:w-52">
          <MinDatePicker
            allowAnyDate
            value={dateFilter}
            onChange={setDateFilter}
            placeholder={t('stocks.filterByDate')}
            className={dateInputClass}
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title={t('stocks.clearDateFilter')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={PANEL.table}>
        {filtered.length === 0 ? (
          <EmptyState icon={Trash2} title={t('stocks.emptyDescartes.title')} description={t('stocks.emptyDescartes.description')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('stocks.table.shipmentNo')}</th>
                  <th className="px-4 py-3">{t('stocks.table.date')}</th>
                  <th className="px-4 py-3">{t('stocks.table.route')}</th>
                  <th className="px-4 py-3">{t('stocks.table.user')}</th>
                  <th className="px-4 py-3">{t('stocks.table.quantity')}</th>
                  <th className="px-4 py-3">{t('stocks.table.tracking')}</th>
                  <th className="px-4 py-3">{t('stocks.table.status')}</th>
                  {canUpdate && <th className="px-4 py-3 text-right">{t('stocks.table.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((r) => {
                  const revertable = revertableKitIds(r);
                  return (
                    <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300">{r.numero_envio || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{formatCalendarDatePt(r.data)}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          {formatRequisicaoLocationLabel(r.origem, r.origem_nome)}
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          {formatRequisicaoLocationLabel(r.destino, r.destino_nome)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{r.utilizador_nome || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{r.quantidade}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.tracking_number || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} map={REQUISICAO_STATUS_STYLES} className="px-2 py-0.5" /></td>
                      {canUpdate && (
                        <td className="px-4 py-3 text-right">
                          {revertable.length > 0 && r.status === 'Entregue' ? (
                            <button
                              type="button"
                              onClick={() => openRevertFlow(r, revertable)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              {t('stocks.revertDescarte.action')}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {kitPickerTarget && (
        <AppModal
          title={t('stocks.revertDescarte.selectKitTitle')}
          onClose={() => !busy && setKitPickerTarget(null)}
        >
          <div className="space-y-2">
            {kitPickerTarget.kitIds.map((kitId) => (
              <button
                key={kitId}
                type="button"
                onClick={() => {
                  setPendingRevert({ requisicao: kitPickerTarget.requisicao, kitId });
                  setKitPickerTarget(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{kitLabel(kitId)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {kitById(kitId)?.tipo_kit || t('pages.contacts.form.kit.defaultLabel')}
                  </div>
                </div>
                <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </button>
            ))}
          </div>
        </AppModal>
      )}

      {pendingRevert && (
        <AppModal
          title={t('stocks.revertDescarte.confirmTitle')}
          icon={AlertTriangle}
          iconClassName="text-amber-600 dark:text-amber-400"
          onClose={() => !busy && setPendingRevert(null)}
          footer={(
            <ModalActions
              onCancel={() => setPendingRevert(null)}
              onSubmit={() => void handleConfirmRevert()}
              cancelLabel={t('stocks.revertDescarte.cancel')}
              submitLabel={busy ? t('stocks.revertDescarte.reverting') : t('stocks.revertDescarte.confirmSubmit')}
              saving={busy}
            />
          )}
        >
          <ModalAlert tone="warning">
            {t('stocks.revertDescarte.confirmWarning')}
          </ModalAlert>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.kit')}</dt>
              <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">{kitLabel(pendingRevert.kitId)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('stocks.table.shipmentNo')}</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{pendingRevert.requisicao.numero_envio || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('stocks.table.route')}</dt>
              <dd className="text-slate-900 dark:text-slate-100 text-right">
                {formatRequisicaoLocationLabel(pendingRevert.requisicao.origem, pendingRevert.requisicao.origem_nome)}
                {' → '}
                {formatRequisicaoLocationLabel(pendingRevert.requisicao.destino, pendingRevert.requisicao.destino_nome)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('stocks.table.date')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatCalendarDatePt(pendingRevert.requisicao.data)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.tipoKit')}</dt>
              <dd className="text-slate-900 dark:text-slate-100 text-right">
                {kitById(pendingRevert.kitId)?.tipo_kit || '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            <label className={FORM.label}>{t('stocks.revertDescarte.observacoes')}</label>
            <textarea
              rows={2}
              className={CONTROL.textarea}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder={t('stocks.revertDescarte.observacoesPlaceholder')}
            />
          </div>
        </AppModal>
      )}
    </div>
  );
}
