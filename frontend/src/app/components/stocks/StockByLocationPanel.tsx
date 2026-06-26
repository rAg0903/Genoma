import { useMemo, useState, type ReactNode } from 'react';
import { MapPin, FlaskConical, Building2, ChevronDown, Package, Layers } from 'lucide-react';
import { Kit, Lote, Posto, Laboratorio, Empresa } from '../../data/types';
import { ChartCard } from '../dashboard/ChartCard';
import {
  computeStockLocationInventory,
  LOW_STOCK_THRESHOLD,
  StockLocationInventory,
} from '../../../lib/stocks';
import { formatNumber } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
  kits: Kit[];
  lotes: Lote[];
  empresas: Empresa[];
  postos: Posto[];
  laboratorios: Laboratorio[];
}

function stockTone(total: number): string {
  if (total === 0) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  if (total < LOW_STOCK_THRESHOLD) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
}

function CountBadge({ value, title }: { value: number; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex min-w-[1.75rem] justify-center text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${stockTone(value)}`}
    >
      {formatNumber(value)}
    </span>
  );
}

function AwaitingBadge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span
      title="Aguarda descarte"
      className="inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    >
      +{formatNumber(value)}
    </span>
  );
}

function KitDetails({
  item,
  noKitsLabel,
  aguardaDescarteLabel,
}: {
  item: StockLocationInventory;
  noKitsLabel: string;
  aguardaDescarteLabel?: string;
}) {
  const hasDisponiveis = item.lotes.length > 0;
  const hasAguarda = (item.lotesAguardaDescarte?.length ?? 0) > 0;

  if (!hasDisponiveis && !hasAguarda) {
    return <p className="text-xs text-slate-400 dark:text-slate-500 py-2 px-3">{noKitsLabel}</p>;
  }

  const renderLotes = (grupos: typeof item.lotes, title?: string) => (
    <div className={title ? 'border-t border-slate-100 dark:border-slate-800' : ''}>
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 px-3 pt-2 pb-1">
          {title}
        </p>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {grupos.map((grupo) => (
          <div key={`${title || 'disp'}-${grupo.lote}`} className="px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Lote {grupo.lote}</span>
                {grupo.teste && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">{grupo.teste}</span>
                )}
              </div>
              <span className="text-[10px] font-bold tabular-nums text-teal-700 dark:text-teal-300 flex-shrink-0">
                {formatNumber(grupo.quantidade)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {grupo.codigosKits.map((codigo) => (
                <span
                  key={codigo}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title={codigo}
                >
                  {codigo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/50">
      {hasDisponiveis && renderLotes(item.lotes)}
      {hasAguarda && renderLotes(item.lotesAguardaDescarte!, aguardaDescarteLabel || 'Aguarda descarte / envio lab')}
    </div>
  );
}

function LocationRow({
  item,
  isOpen,
  onToggle,
  noKitsLabel,
  aguardaDescarteLabel,
  nested = false,
}: {
  item: StockLocationInventory;
  isOpen: boolean;
  onToggle: () => void;
  noKitsLabel: string;
  aguardaDescarteLabel?: string;
  nested?: boolean;
}) {
  const hasDetails = item.lotes.length > 0 || (item.lotesAguardaDescarte?.length ?? 0) > 0;

  return (
    <div className={nested ? 'border-l-2 border-sky-200 dark:border-sky-800 ml-3' : ''}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
          isOpen ? 'bg-slate-50 dark:bg-slate-800/30' : ''
        }`}
      >
        {nested && <MapPin className="w-3 h-3 text-sky-500 flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={`${nested ? 'text-xs' : 'text-[13px]'} font-medium text-slate-900 dark:text-slate-100 truncate`}>
              {item.nome}
            </span>
            {item.codigo && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex-shrink">{item.codigo}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <CountBadge value={item.totalDisponiveis} />
          <AwaitingBadge value={item.totalAguardaDescarte ?? 0} />
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''} ${!hasDetails && item.totalDisponiveis === 0 && !(item.totalAguardaDescarte ?? 0) ? 'opacity-30' : ''}`}
          />
        </div>
      </button>
      {isOpen && (
        <KitDetails item={item} noKitsLabel={noKitsLabel} aguardaDescarteLabel={aguardaDescarteLabel} />
      )}
    </div>
  );
}

function SectionBlock({
  icon: Icon,
  iconClass,
  title,
  count,
  children,
  defaultOpen = true,
}: {
  icon: typeof Building2;
  iconClass: string;
  title: string;
  count: number | string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex-1 text-left">{title}</span>
        <span className="text-[10px] text-slate-400 tabular-nums">{count}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>}
    </div>
  );
}

function SummaryStrip({
  empresasStock,
  postosStock,
  aguardaTotal,
  labFinalTotal,
  labels,
}: {
  empresasStock: number;
  postosStock: number;
  aguardaTotal: number;
  labFinalTotal: number;
  labels: { empresas: string; postos: string; aguarda: string; labFinal: string };
}) {
  const items = [
    { label: labels.empresas, value: empresasStock, tone: stockTone(empresasStock) },
    { label: labels.postos, value: postosStock, tone: stockTone(postosStock) },
    { label: labels.aguarda, value: aguardaTotal, tone: aguardaTotal > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : stockTone(0) },
    { label: labels.labFinal, value: labFinalTotal, tone: stockTone(labFinalTotal) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-2 bg-slate-50/50 dark:bg-slate-900/20"
        >
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{item.label}</span>
          <span className={`text-sm font-bold tabular-nums px-1.5 py-0.5 rounded-md ${item.tone}`}>
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StockByLocationPanel({ kits, lotes, empresas, postos, laboratorios }: Props) {
  const { t } = useLanguage();
  const inventory = useMemo(
    () => computeStockLocationInventory(kits, lotes, empresas, postos, laboratorios),
    [kits, lotes, empresas, postos, laboratorios],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const noKitsLabel = t('stocks.locationPanel.noKitsHere');
  const aguardaDescarteLabel = t('stocks.locationPanel.awaitingDiscard');

  const empresasStock = inventory.empresas.reduce((s, e) => s + e.totalDisponiveis, 0);
  const postosStock = inventory.laboratorios.reduce(
    (s, lab) => s + lab.postos.reduce((ps, p) => ps + p.totalDisponiveis, 0),
    0,
  ) + inventory.postosSemLaboratorio.reduce((s, p) => s + p.totalDisponiveis, 0);
  const aguardaTotal = kits.filter((k) => k.fase_ciclo === 'aguarda_envio_lab').length;
  const labFinalTotal = inventory.laboratoriosFinais.reduce((s, l) => s + l.totalDisponiveis, 0);

  const renderEmpty = (message: string) => (
    <p className="text-xs text-slate-400 dark:text-slate-500 px-3 py-4 text-center">{message}</p>
  );

  return (
    <ChartCard
      title={t('stocks.locationPanel.title')}
      subtitle={t('stocks.locationPanel.subtitle')}
      icon={Package}
    >
      <SummaryStrip
        empresasStock={empresasStock}
        postosStock={postosStock}
        aguardaTotal={aguardaTotal}
        labFinalTotal={labFinalTotal}
        labels={{
          empresas: t('stocks.locationPanel.summaryCompanies'),
          postos: t('stocks.locationPanel.summarySites'),
          aguarda: t('stocks.locationPanel.summaryAwaiting'),
          labFinal: t('stocks.locationPanel.summaryLabFinal'),
        }}
      />

      <div className="space-y-2">
        <SectionBlock
          icon={Building2}
          iconClass="text-teal-500"
          title={t('stocks.locationPanel.companies')}
          count={inventory.empresas.length}
        >
          {inventory.empresas.length === 0
            ? renderEmpty(t('stocks.locationPanel.noRecords', { section: t('stocks.locationPanel.companies').toLowerCase() }))
            : inventory.empresas.map((item) => (
              <LocationRow
                key={item.id}
                item={item}
                isOpen={expandedId === `empresa:${item.id}`}
                onToggle={() => toggle(`empresa:${item.id}`)}
                noKitsLabel={noKitsLabel}
              />
            ))}
        </SectionBlock>

        <SectionBlock
          icon={FlaskConical}
          iconClass="text-violet-500"
          title={t('stocks.locationPanel.labsWithSites')}
          count={inventory.laboratorios.length}
        >
          {inventory.laboratorios.length === 0
            ? renderEmpty(t('stocks.locationPanel.noRecords', { section: t('stocks.locationPanel.labs').toLowerCase() }))
            : inventory.laboratorios.map((lab) => {
              const postosStockLab = lab.postos.reduce((s, p) => s + p.totalDisponiveis, 0);
              const labOpen = expandedId === `lab:${lab.id}`;

              return (
                <div key={lab.id}>
                  <button
                    type="button"
                    onClick={() => toggle(`lab:${lab.id}`)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      labOpen ? 'bg-slate-50 dark:bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{lab.nome}</span>
                        {lab.codigo && (
                          <span className="text-[10px] text-slate-400 truncate">{lab.codigo}</span>
                        )}
                      </div>
                      {lab.postos.length > 0 && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('stocks.locationPanel.sitesSummary', { count: lab.postos.length, kits: postosStockLab })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <CountBadge value={postosStockLab} />
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${labOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {labOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pb-1">
                      {lab.postos.length === 0 ? (
                        <p className="text-[11px] text-slate-400 px-3 py-2">Este laboratório não tem postos associados.</p>
                      ) : (
                        lab.postos.map((posto) => (
                          <LocationRow
                            key={posto.id}
                            item={posto}
                            isOpen={expandedId === `posto:${lab.id}:${posto.id}`}
                            onToggle={() => toggle(`posto:${lab.id}:${posto.id}`)}
                            noKitsLabel={noKitsLabel}
                            aguardaDescarteLabel={aguardaDescarteLabel}
                            nested
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </SectionBlock>

        {inventory.postosSemLaboratorio.length > 0 && (
          <SectionBlock
            icon={MapPin}
            iconClass="text-sky-500"
            title={t('stocks.locationPanel.unassignedSites')}
            count={inventory.postosSemLaboratorio.length}
            defaultOpen={false}
          >
            {inventory.postosSemLaboratorio.map((item) => (
              <LocationRow
                key={item.id}
                item={item}
                isOpen={expandedId === `orphan:${item.id}`}
                onToggle={() => toggle(`orphan:${item.id}`)}
                noKitsLabel={noKitsLabel}
                aguardaDescarteLabel={aguardaDescarteLabel}
              />
            ))}
          </SectionBlock>
        )}

        {inventory.laboratoriosFinais.length > 0 && (
          <SectionBlock
            icon={Layers}
            iconClass="text-indigo-500"
            title={t('stocks.locationPanel.labFinal')}
            count={`${labFinalTotal} kits`}
            defaultOpen={labFinalTotal > 0}
          >
            <p className="text-[10px] text-slate-500 dark:text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
              {t('stocks.locationPanel.labFinalSubtitle')}
            </p>
            {inventory.laboratoriosFinais.map((item) => (
              <LocationRow
                key={item.id}
                item={item}
                isOpen={expandedId === `labfinal:${item.id}`}
                onToggle={() => toggle(`labfinal:${item.id}`)}
                noKitsLabel={noKitsLabel}
              />
            ))}
          </SectionBlock>
        )}
      </div>
    </ChartCard>
  );
}
