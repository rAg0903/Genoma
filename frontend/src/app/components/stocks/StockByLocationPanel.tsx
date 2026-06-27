import { useMemo, useState, Fragment } from 'react';
import { MapPin, FlaskConical, Building2, Package, Layers, ChevronRight } from 'lucide-react';
import { Kit, Lote, Posto, Laboratorio, Empresa } from '../../data/types';
import { ChartCard } from '../dashboard/ChartCard';
import {
  computeStockLocationInventory,
  LOW_STOCK_THRESHOLD,
  StockLocationInventory,
} from '../../../lib/stocks';
import { formatNumber, SURFACE } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
  kits: Kit[];
  lotes: Lote[];
  empresas: Empresa[];
  postos: Posto[];
  laboratorios: Laboratorio[];
}

type InventoryCategory = 'all' | 'empresa' | 'posto' | 'lab_final';

type InventoryRow = {
  id: string;
  category: Exclude<InventoryCategory, 'all'>;
  nome: string;
  codigo?: string;
  disponiveis: number;
  aguarda: number;
  item: StockLocationInventory;
};

type InventorySection = {
  id: string;
  title: string;
  subtitle?: string;
  totalDisponiveis: number;
  totalPostos?: number;
  rows: InventoryRow[];
};

function postoRow(labId: string, posto: StockLocationInventory, labKey: string): InventoryRow {
  return {
    id: `posto:${labKey}:${posto.id}`,
    category: 'posto',
    nome: posto.nome,
    codigo: posto.codigo,
    disponiveis: posto.totalDisponiveis,
    aguarda: posto.totalAguardaDescarte ?? 0,
    item: posto,
  };
}

function buildInventorySections(
  inventory: ReturnType<typeof computeStockLocationInventory>,
): InventorySection[] {
  const sections: InventorySection[] = [];

  if (inventory.empresas.length > 0) {
    sections.push({
      id: 'empresas',
      title: 'Empresas',
      totalDisponiveis: inventory.empresas.reduce((s, e) => s + e.totalDisponiveis, 0),
      rows: inventory.empresas.map((item) => ({
        id: `empresa:${item.id}`,
        category: 'empresa',
        nome: item.nome,
        codigo: item.codigo,
        disponiveis: item.totalDisponiveis,
        aguarda: item.totalAguardaDescarte ?? 0,
        item,
      })),
    });
  }

  for (const lab of inventory.laboratorios) {
    if (lab.postos.length === 0) continue;
    const postosStock = lab.postos.reduce((s, p) => s + p.totalDisponiveis, 0);
    sections.push({
      id: `lab:${lab.id}`,
      title: lab.nome,
      subtitle: lab.codigo,
      totalDisponiveis: postosStock,
      totalPostos: lab.postos.length,
      rows: lab.postos.map((posto) => postoRow(lab.id, posto, lab.id)),
    });
  }

  if (inventory.postosSemLaboratorio.length > 0) {
    sections.push({
      id: 'postos-sem-lab',
      title: 'Postos sem laboratório',
      totalDisponiveis: inventory.postosSemLaboratorio.reduce((s, p) => s + p.totalDisponiveis, 0),
      totalPostos: inventory.postosSemLaboratorio.length,
      rows: inventory.postosSemLaboratorio.map((posto) => postoRow('orphan', posto, 'orphan')),
    });
  }

  if (inventory.laboratoriosFinais.length > 0) {
    sections.push({
      id: 'labs-finais',
      title: 'Em laboratório final',
      subtitle: 'Kits consumidos ou em trânsito para processamento',
      totalDisponiveis: inventory.laboratoriosFinais.reduce((s, l) => s + l.totalDisponiveis, 0),
      rows: inventory.laboratoriosFinais.map((lab) => ({
        id: `labfinal:${lab.id}`,
        category: 'lab_final',
        nome: lab.nome,
        codigo: lab.codigo,
        disponiveis: lab.totalDisponiveis,
        aguarda: lab.totalAguardaDescarte ?? 0,
        item: lab,
      })),
    });
  }

  return sections;
}

function filterSections(sections: InventorySection[], filter: InventoryCategory): InventorySection[] {
  if (filter === 'all') return sections;
  if (filter === 'empresa') {
    return sections.filter((s) => s.id === 'empresas').map((s) => ({ ...s, rows: [...s.rows] }));
  }
  if (filter === 'posto') {
    return sections
      .filter((s) => s.id.startsWith('lab:') || s.id === 'postos-sem-lab')
      .map((s) => ({ ...s, rows: [...s.rows] }));
  }
  if (filter === 'lab_final') {
    return sections.filter((s) => s.id === 'labs-finais').map((s) => ({ ...s, rows: [...s.rows] }));
  }
  return sections;
}

function InventoryDataRow({
  row,
  nested,
  expandedId,
  onToggle,
  noKitsLabel,
  aguardaDescarteLabel,
}: {
  row: InventoryRow;
  nested?: boolean;
  expandedId: string | null;
  onToggle: (id: string) => void;
  noKitsLabel: string;
  aguardaDescarteLabel?: string;
}) {
  const isOpen = expandedId === row.id;
  const hasDetails = row.item.lotes.length > 0 || (row.item.lotesAguardaDescarte?.length ?? 0) > 0;
  const status = stockStatusLabel(row.disponiveis);

  return (
    <Fragment key={row.id}>
      <tr
        className={`transition-colors ${hasDetails ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : ''} ${isOpen ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
        onClick={hasDetails ? () => onToggle(row.id) : undefined}
      >
        <td className={`px-3.5 py-2 ${nested ? 'pl-6 border-l-2 border-violet-200 dark:border-violet-800' : ''}`}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {CATEGORY_LABEL[row.category]}
          </span>
        </td>
        <td className="px-3 py-2 min-w-0">
          <p className={`${nested ? 'text-xs' : 'text-[13px]'} font-medium text-slate-900 dark:text-slate-100 truncate`} title={row.nome}>
            {row.nome}
          </p>
          {row.codigo && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.codigo}</p>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          <span className={`text-sm font-bold tabular-nums px-1.5 py-0.5 rounded-md ${stockTone(row.disponiveis)}`}>
            {formatNumber(row.disponiveis)}
          </span>
        </td>
        <td className="px-3 py-2 text-right">
          {row.aguarda > 0 ? (
            <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300">
              {formatNumber(row.aguarda)}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )}
        </td>
        <td className="px-3 py-2">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${stockTone(row.disponiveis)}`}>
            {status}
          </span>
        </td>
        <td className="px-2 py-2 text-slate-300 dark:text-slate-600">
          {hasDetails && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          )}
        </td>
      </tr>
      {isOpen && hasDetails && (
        <tr>
          <td colSpan={6} className="p-0">
            <KitDetailsPanel
              item={row.item}
              noKitsLabel={noKitsLabel}
              aguardaDescarteLabel={aguardaDescarteLabel}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function stockTone(total: number): string {
  if (total === 0) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  if (total < LOW_STOCK_THRESHOLD) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
}

function stockStatusLabel(total: number): string {
  if (total === 0) return 'Vazio';
  if (total < LOW_STOCK_THRESHOLD) return 'Baixo';
  return 'OK';
}

function KitDetailsPanel({
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
    <div className={title ? 'border-t border-slate-200 dark:border-slate-700' : ''}>
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 px-3 pt-2 pb-1">
          {title}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
        {grupos.map((grupo) => (
          <div key={`${title || 'disp'}-${grupo.lote}`} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Lote {grupo.lote}</span>
              <span className="text-[10px] font-bold tabular-nums text-teal-700 dark:text-teal-300 flex-shrink-0">
                {formatNumber(grupo.quantidade)}
              </span>
            </div>
            {grupo.teste && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 truncate">{grupo.teste}</p>
            )}
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {grupo.codigosKits.map((codigo) => (
                <span
                  key={codigo}
                  className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
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
    <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
      {hasDisponiveis && renderLotes(item.lotes)}
      {hasAguarda && renderLotes(item.lotesAguardaDescarte!, aguardaDescarteLabel || 'Aguarda descarte / envio lab')}
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

const FILTER_META: { id: InventoryCategory; label: string; icon: typeof MapPin }[] = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'empresa', label: 'Empresas', icon: Building2 },
  { id: 'posto', label: 'Postos', icon: MapPin },
  { id: 'lab_final', label: 'Lab final', icon: FlaskConical },
];

const CATEGORY_LABEL: Record<InventoryRow['category'], string> = {
  empresa: 'Empresa',
  posto: 'Posto',
  lab_final: 'Lab final',
};


export function StockByLocationPanel({ kits, lotes, empresas, postos, laboratorios }: Props) {
  const { t } = useLanguage();
  const inventory = useMemo(
    () => computeStockLocationInventory(kits, lotes, empresas, postos, laboratorios),
    [kits, lotes, empresas, postos, laboratorios],
  );

  const [filter, setFilter] = useState<InventoryCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const noKitsLabel = t('stocks.locationPanel.noKitsHere');
  const aguardaDescarteLabel = t('stocks.locationPanel.awaitingDiscard');

  const empresasStock = inventory.empresas.reduce((s, e) => s + e.totalDisponiveis, 0);
  const postosStock = inventory.laboratorios.reduce(
    (s, lab) => s + lab.postos.reduce((ps, p) => ps + p.totalDisponiveis, 0),
    0,
  ) + inventory.postosSemLaboratorio.reduce((s, p) => s + p.totalDisponiveis, 0);
  const aguardaTotal = kits.filter((k) => k.fase_ciclo === 'aguarda_envio_lab').length;
  const labFinalTotal = inventory.laboratoriosFinais.reduce((s, l) => s + l.totalDisponiveis, 0);

  const allSections = useMemo(() => buildInventorySections(inventory), [inventory]);
  const allRows = useMemo(() => allSections.flatMap((s) => s.rows), [allSections]);

  const counts = useMemo(() => ({
    all: allRows.length,
    empresa: allRows.filter((r) => r.category === 'empresa').length,
    posto: allRows.filter((r) => r.category === 'posto').length,
    lab_final: allRows.filter((r) => r.category === 'lab_final').length,
  }), [allRows]);

  const visibleSections = useMemo(
    () => filterSections(allSections, filter),
    [allSections, filter],
  );

  const visibleRowCount = visibleSections.reduce((s, sec) => s + sec.rows.length, 0);

  const toggleRow = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

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

      <div className={`${SURFACE.cardElevated} overflow-hidden -mx-1 sm:mx-0`}>
        <div className="flex flex-wrap gap-1.5 px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          {FILTER_META.map(({ id, label, icon: Icon }) => {
            const count = counts[id];
            if (id !== 'all' && count === 0) return null;
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setFilter(id); setExpandedId(null); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <span className={`tabular-nums ${active ? 'text-teal-100' : 'text-slate-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {visibleRowCount === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 px-3.5 py-8 text-center">
            {t('stocks.locationPanel.noRecords', { section: FILTER_META.find((f) => f.id === filter)?.label.toLowerCase() ?? 'locais' })}
          </p>
        ) : (
          <div className="overflow-auto max-h-[min(360px,45vh)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900 shadow-[0_1px_0_0_rgba(148,163,184,0.25)]">
                <tr className="text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-3.5 py-2 font-semibold w-20">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Local</th>
                  <th className="px-3 py-2 font-semibold text-right w-16">Disp.</th>
                  <th className="px-3 py-2 font-semibold text-right w-16">Aguarda</th>
                  <th className="px-3 py-2 font-semibold w-20">Estado</th>
                  <th className="px-2 py-2 w-8" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {visibleSections.map((section) => {
                  const showSectionHeader =
                    section.id.startsWith('lab:')
                    || section.id === 'postos-sem-lab'
                    || (filter === 'all' && (section.id === 'empresas' || section.id === 'labs-finais'))
                    || (filter === 'empresa' && section.id === 'empresas')
                    || (filter === 'lab_final' && section.id === 'labs-finais');

                  return (
                    <Fragment key={section.id}>
                      {showSectionHeader && (
                        <tr className="bg-slate-50/90 dark:bg-slate-800/50">
                          <td colSpan={6} className="px-3.5 py-2 border-y border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                {section.id.startsWith('lab:') && (
                                  <FlaskConical className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                                )}
                                {section.id === 'empresas' && (
                                  <Building2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                                )}
                                {section.id === 'labs-finais' && (
                                  <Layers className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                )}
                                {section.id === 'postos-sem-lab' && (
                                  <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                    {section.title}
                                  </span>
                                  {section.subtitle && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
                                      {section.subtitle}
                                    </span>
                                  )}
                                  {section.totalPostos != null && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                                      · {section.totalPostos} posto{section.totalPostos !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md flex-shrink-0 ${stockTone(section.totalDisponiveis)}`}>
                                {formatNumber(section.totalDisponiveis)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {section.rows.map((row) => (
                        <InventoryDataRow
                          key={row.id}
                          row={row}
                          nested={section.id.startsWith('lab:') || section.id === 'postos-sem-lab'}
                          expandedId={expandedId}
                          onToggle={toggleRow}
                          noKitsLabel={noKitsLabel}
                          aguardaDescarteLabel={aguardaDescarteLabel}
                        />
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visibleRowCount > 10 && (
          <p className="px-3.5 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            {visibleRowCount} locais — clique numa linha para ver lotes e kits
          </p>
        )}
      </div>
    </ChartCard>
  );
}
