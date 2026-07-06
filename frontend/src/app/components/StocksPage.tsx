import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Boxes, ClipboardList, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Lote, RequisicaoKit } from '../data/types';
import { StockSubmodule } from '../../lib/permissions';
import { resolveFeatureHealthLab, filterLaboratoriosFinais } from '../../lib/stock-locations';
import { LAYOUT, PAGE } from '../../lib/design-tokens';
import { PageHeader } from './shared/PageHeader';
import { PageTabsRow } from './shared/PageToolbar';
import { TabsBar } from './shared/TabsBar';
import { ReadOnlyNotice } from './shared/ReadOnlyNotice';
import { StockAlertsPanel } from './stocks/StockAlertsPanel';
import { StockKpis } from './stocks/StockKpis';
import { StockCharts } from './stocks/StockCharts';
import { StockByLocationPanel } from './stocks/StockByLocationPanel';
import { LotesTab } from './stocks/LotesTab';
import { RequisicoesTab } from './stocks/RequisicoesTab';
import { DescartesTab } from './stocks/DescartesTab';
import { LoteFormModal, RequisicaoFormModal, RequisicaoEditModal } from './stocks/StockForms';
import { computeStockAlerts } from '../../lib/stocks';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { DashboardAlert } from './dashboard/AlertPanel';

type StocksTab = 'lotes' | 'requisicoes' | 'descartes';
const STOCKS_TABS: StocksTab[] = ['lotes', 'requisicoes', 'descartes'];
const TAB_META: Record<StocksTab, { labelKey: string; icon: typeof Boxes }> = {
  lotes: { labelKey: 'stocks.tabs.lotes', icon: Boxes },
  requisicoes: { labelKey: 'stocks.tabs.requisicoes', icon: ClipboardList },
  descartes: { labelKey: 'stocks.tabs.descartes', icon: Trash2 },
};

const LEGACY_STOCK_TABS = new Set(['kits', 'auditoria']);

export function StocksPage() {
  const {
    kits, addKit, checkKitDuplicado,
    lotes, addLote, updateLote,
    requisicoesKits, addRequisicaoKit, updateRequisicaoKit, revertDescarteKit,
    postos, laboratorios, empresas,
  } = useData();
  const { hasPermission, hasStockSubmodulePermission } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreate = hasPermission('stocks', 'create');
  const canUpdate = hasPermission('stocks', 'update');

  const allowedTabs = STOCKS_TABS.filter((tab) => hasStockSubmodulePermission(tab as StockSubmodule));
  const urlTab = searchParams.get('tab');
  const activeTab: StocksTab =
    urlTab && allowedTabs.includes(urlTab as StocksTab)
      ? (urlTab as StocksTab)
      : (allowedTabs[0] ?? 'lotes');

  useEffect(() => {
    if (!urlTab || !LEGACY_STOCK_TABS.has(urlTab)) return;
    const params = new URLSearchParams(searchParams);
    params.delete('tab');
    setSearchParams(params, { replace: true });
  }, [urlTab, searchParams, setSearchParams]);

  const setTab = (tab: StocksTab) => setSearchParams(tab === 'lotes' ? {} : { tab });

  const [loteModal, setLoteModal] = useState<{ open: boolean; lote: Lote | null }>({ open: false, lote: null });
  const [reqModal, setReqModal] = useState(false);
  const [editReq, setEditReq] = useState<RequisicaoKit | null>(null);

  const finalLabIds = useMemo(
    () => filterLaboratoriosFinais(laboratorios).map((l) => l.id),
    [laboratorios],
  );
  const defaultFinalLab = useMemo(() => resolveFeatureHealthLab(laboratorios), [laboratorios]);

  const alerts = useMemo<DashboardAlert[]>(
    () => computeStockAlerts(kits, lotes, requisicoesKits, empresas, postos, laboratorios).map((a) => ({
      id: a.id,
      nivel: a.nivel,
      titulo: a.titulo,
      descricao: a.descricao,
      total: a.total,
    })),
    [kits, lotes, requisicoesKits, empresas, postos, laboratorios],
  );

  const tabAction = useMemo(() => {
    if (!canCreate) return null;
    switch (activeTab) {
      case 'lotes':
        return { label: t('stocks.actions.newBatch'), mobileLabel: t('common.new'), onClick: () => setLoteModal({ open: true, lote: null }), icon: Plus };
      case 'requisicoes':
        return { label: t('stocks.actions.newShipment'), mobileLabel: t('common.new'), onClick: () => setReqModal(true), icon: Plus };
      default:
        return null;
    }
  }, [activeTab, canCreate, t]);

  const wrap = async (fn: () => Promise<void> | void, ok: string) => {
    try { await fn(); toast.success(ok); }
    catch (e) { toast.error(e instanceof Error ? e.message : t('common.operationFailed')); }
  };

  const TabActionIcon = tabAction?.icon;

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader title={t('nav.stocks')} subtitle={t('stocks.subtitle')}>
          {allowedTabs.length > 0 && (
            <PageTabsRow
              actions={tabAction ? (
                <button type="button" onClick={tabAction.onClick} className={ADD_ACTION_BUTTON_CLASS}>
                  {TabActionIcon && <TabActionIcon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{tabAction.label}</span>
                  <span className="sm:hidden">{tabAction.mobileLabel || tabAction.label}</span>
                </button>
              ) : undefined}
            >
              <TabsBar
                items={allowedTabs.map((tab) => ({ id: tab, label: t(TAB_META[tab].labelKey), icon: TAB_META[tab].icon }))}
                active={activeTab}
                onChange={setTab}
              />
            </PageTabsRow>
          )}
        </PageHeader>

        {!canCreate && !canUpdate && <ReadOnlyNotice />}

        {activeTab === 'lotes' && (
          <LotesTab
            lotes={lotes}
            kits={kits}
            canUpdate={canUpdate}
            canCreate={canCreate}
            onEdit={(l) => setLoteModal({ open: true, lote: l })}
            onCheckDuplicado={checkKitDuplicado}
            onAddKits={async (lote, novos) => {
              await wrap(async () => { for (const k of novos) { await addKit(k); } }, t('stocks.toast.kitsAdded', { count: novos.length, code: lote.codigo }));
            }}
          />
        )}
        {activeTab === 'requisicoes' && (
          <RequisicoesTab
            requisicoes={requisicoesKits}
            canUpdate={canUpdate}
            onEdit={(r) => setEditReq(r)}
            featureHealthLabId={finalLabIds.length ? undefined : defaultFinalLab?.id}
            finalLabIds={finalLabIds}
          />
        )}
        {activeTab === 'descartes' && (
          <DescartesTab
            requisicoes={requisicoesKits}
            kits={kits}
            canUpdate={canUpdate}
            onRevertKit={revertDescarteKit}
            featureHealthLabId={finalLabIds.length ? undefined : defaultFinalLab?.id}
            finalLabIds={finalLabIds}
          />
        )}

        <StockByLocationPanel kits={kits} lotes={lotes} empresas={empresas} postos={postos} laboratorios={laboratorios} />

        <StockKpis kits={kits} lotes={lotes} />

        <div className={`grid grid-cols-1 ${LAYOUT.gridGap}`}>
          <StockCharts kits={kits} lotes={lotes} />
          <StockAlertsPanel alerts={alerts} />
        </div>
      </div>

      {loteModal.open && (
        <LoteFormModal lote={loteModal.lote} onClose={() => setLoteModal({ open: false, lote: null })}
          onSave={(data) => { void wrap(() => (loteModal.lote ? updateLote(loteModal.lote.id, data) : addLote(data)), loteModal.lote ? t('stocks.toast.batchUpdated') : t('stocks.toast.batchCreated')); setLoteModal({ open: false, lote: null }); }} />
      )}
      {reqModal && (
        <RequisicaoFormModal onClose={() => setReqModal(false)}
          onSave={(data) => { void wrap(() => addRequisicaoKit(data), t('stocks.toast.shipmentRegistered')); setReqModal(false); }} />
      )}
      {editReq && (
        <RequisicaoEditModal
          requisicao={editReq}
          onClose={() => setEditReq(null)}
          onSave={(data) => {
            void wrap(async () => {
              await updateRequisicaoKit(editReq.id, data);
            }, t('stocks.toast.shipmentUpdated'));
            setEditReq(null);
          }}
        />
      )}
    </div>
  );
}
