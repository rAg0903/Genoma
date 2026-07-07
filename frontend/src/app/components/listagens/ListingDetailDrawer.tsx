import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { DetailDrawer } from '../shared/DetailDrawer';
import { TraceView, TraceTipo } from '../shared/TraceView';
import { ListingColumn, ListingRow, ListingKey } from '../../../lib/api-listagens';
import { ListingDef } from './listingConfig';
import { formatEUR, formatNumber } from '../../../lib/design-tokens';
import { useLanguage } from '../../../i18n/LanguageContext';

type DrawerTabId = 'detalhe' | 'rastreio';

interface Props {
  listing: ListingKey;
  row: ListingRow | null;
  columns: ListingColumn[];
  def: ListingDef;
  onClose: () => void;
  onNavigateTab: (key: ListingKey, q?: string) => void;
}

const TRACE: Partial<Record<ListingKey, { tipo: TraceTipo; idKey: string }>> = {
  painel_bordo: { tipo: 'processo', idKey: 'id' },
  processos: { tipo: 'processo', idKey: 'id' },
  resultados: { tipo: 'processo', idKey: 'id' },
  colheitas: { tipo: 'processo', idKey: 'processo_id' },
  kits: { tipo: 'kit', idKey: 'id' },
  lotes: { tipo: 'lote', idKey: 'id' },
};

const MODULE_ROUTE: Partial<Record<ListingKey, string>> = {
  kits: '/stocks',
  lotes: '/stocks',
  pacientes: '/contactos',
  medicos: '/definicoes/medicos',
};

const PROCESS_LISTINGS = new Set<ListingKey>(['painel_bordo', 'processos', 'resultados', 'faturacao']);

const str = (row: ListingRow, key: string) => (row[key] != null && String(row[key]).trim() !== '' ? String(row[key]) : '');

/** Rota concreta no módulo correspondente (ex.: /processos/:id). */
function resolveModuleNavigation(listing: ListingKey, row: ListingRow): string | null {
  if (PROCESS_LISTINGS.has(listing)) {
    const id = str(row, 'id');
    return id ? `/processos/${id}` : null;
  }
  if (listing === 'colheitas') {
    const id = str(row, 'processo_id');
    return id ? `/processos/${id}` : null;
  }
  if (listing === 'kits') {
    const codigo = str(row, 'codigo');
    return codigo ? `/stocks?tab=kits&q=${encodeURIComponent(codigo)}` : '/stocks';
  }
  if (listing === 'lotes') {
    const codigo = str(row, 'codigo');
    return codigo ? `/stocks?tab=lotes&q=${encodeURIComponent(codigo)}` : '/stocks';
  }
  if (listing === 'pacientes') {
    const id = str(row, 'id');
    return id ? `/contactos/${id}` : null;
  }
  if (listing === 'medicos') {
    const id = str(row, 'id');
    return id ? `/definicoes/medicos/${id}/editar` : null;
  }
  return MODULE_ROUTE[listing] ?? null;
}

function moduleActionLabel(listing: ListingKey, t: (key: string) => string): string {
  if (PROCESS_LISTINGS.has(listing) || listing === 'colheitas') return t('listingsPage.openProcess');
  if (listing === 'kits' || listing === 'lotes') return t('listingsPage.openStocks');
  if (listing === 'pacientes') return t('listingsPage.openContact');
  if (listing === 'medicos') return t('listingsPage.openDoctor');
  return t('listingsPage.openModule');
}

const fmtValue = (def: ListingDef, key: string, value: ListingRow[string]) => {
  if (value === null || value === undefined || value === '') return '—';
  const f = def.formats[key];
  if (f === 'eur') return formatEUR(Number(value));
  if (f === 'number') return formatNumber(Number(value));
  if (f === 'date') return new Date(String(value)).toLocaleDateString('pt-PT');
  if (f === 'datetime') return new Date(String(value)).toLocaleString('pt-PT');
  return String(value);
};

export function ListingDetailDrawer({ listing, row, columns, def, onClose, onNavigateTab }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const trace = TRACE[listing];
  const [tab, setTab] = useState<DrawerTabId>('detalhe');

  const columnHeader = (col: ListingColumn) => {
    const key = `listingsPage.columns.${listing}.${col.key}`;
    const translated = t(key);
    return translated !== key ? translated : col.header;
  };

  useEffect(() => { setTab('detalhe'); }, [row]);

  if (!row) return null;

  const titleKey = columns[0]?.key ?? 'id';
  const title = String(row[titleKey] ?? 'Detalhe');

  const quickLinks: { label: string; onClick: () => void }[] = [];
  const processId = PROCESS_LISTINGS.has(listing)
    ? str(row, 'id')
    : listing === 'colheitas'
      ? str(row, 'processo_id')
      : '';
  if ((listing === 'resultados' || listing === 'faturacao' || listing === 'colheitas') && processId) {
    quickLinks.push({
      label: t('listingsPage.quickViewProcess', { numero: str(row, 'numero') || str(row, 'processo') }),
      onClick: () => { onClose(); navigate(`/processos/${processId}`); },
    });
  } else if ((listing === 'resultados' || listing === 'faturacao' || listing === 'colheitas') && str(row, 'numero')) {
    quickLinks.push({ label: `Ver processo: ${str(row, 'numero')}`, onClick: () => onNavigateTab('painel_bordo', str(row, 'numero')) });
  }
  if (listing === 'colheitas' && str(row, 'kit')) {
    quickLinks.push({ label: `Ver kit: ${str(row, 'kit')}`, onClick: () => onNavigateTab('kits', str(row, 'kit')) });
  } else if (listing === 'kits') {
    if (str(row, 'lote')) quickLinks.push({ label: `Ver lote: ${str(row, 'lote')}`, onClick: () => onNavigateTab('lotes', str(row, 'lote')) });
  } else if (listing === 'lotes') {
    if (str(row, 'codigo')) quickLinks.push({ label: 'Ver kits deste lote', onClick: () => onNavigateTab('kits', str(row, 'codigo')) });
  }

  const moduleRoute = resolveModuleNavigation(listing, row);

  return (
    <DetailDrawer<DrawerTabId>
      open={!!row}
      onClose={onClose}
      title={title}
      subtitle={t(`listings.${listing}`)}
      tabs={trace ? [{ id: 'detalhe', label: 'Detalhe' }, { id: 'rastreio', label: 'Rastreabilidade' }] : undefined}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'rastreio' && trace ? (
        <TraceView tipo={trace.tipo} id={String(row[trace.idKey] ?? '')} />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{columnHeader(col)}</span>
                <span className="text-sm text-slate-800 dark:text-slate-200 text-right">{fmtValue(def, col.key, row[col.key])}</span>
              </div>
            ))}
          </div>

          {quickLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Navegação rápida</p>
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={link.onClick}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="truncate">{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {moduleRoute && (
            <button
              type="button"
              onClick={() => { onClose(); navigate(moduleRoute); }}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition"
            >
              <ExternalLink className="w-4 h-4" />
              {moduleActionLabel(listing, t)}
            </button>
          )}
        </div>
      )}
    </DetailDrawer>
  );
}
