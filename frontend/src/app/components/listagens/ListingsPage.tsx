import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FlaskConical, Receipt, Package, Boxes, BadgeCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useGlobalSearch } from '../../context/GlobalSearchContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { PageHeader } from '../shared/PageHeader';
import { PageTabsRow } from '../shared/PageToolbar';
import { TabsBar } from '../shared/TabsBar';
import { FilterBar } from '../shared/FilterBar';
import { KpiCard } from '../dashboard/KpiCard';
import { CONTROL, formatEUR, LAYOUT, PAGE } from '../../../lib/design-tokens';
import {
  listagensApi, ListingKey, ListingColumn, ListingRow, ListingPagination, ListingQuery,
} from '../../../lib/api-listagens';
import { LISTINGS, LISTING_ORDER, ListingDef } from './listingConfig';
import { ListingsSubmodule } from '../../../lib/permissions';
import { ListingTable } from './ListingTable';
import { ListingDetailDrawer } from './ListingDetailDrawer';
import { ExportMenu } from './ExportMenu';
import { AdvancedFilters, AdvancedFilterState, countActiveFilters } from './AdvancedFilters';

const PAGE_SIZE = 25;

export function ListingsPage() {
  const { t } = useLanguage();
  const { openSearch } = useGlobalSearch();
  const { hasListingsSubmodulePermission } = useAuth();
  const { processos, kits, lotes } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const visibleTabs = useMemo(
    () => LISTING_ORDER.filter((key) => hasListingsSubmodulePermission(key as ListingsSubmodule)),
    [hasListingsSubmodulePermission],
  );

  const tabParam = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (tabParam && visibleTabs.includes(tabParam as ListingKey)) return tabParam as ListingKey;
    return (visibleTabs[0] ?? 'painel_bordo') as ListingKey;
  }, [tabParam, visibleTabs]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (tabParam && !visibleTabs.includes(tabParam as ListingKey)) {
      const params = new URLSearchParams(searchParams);
      if (activeTab === 'painel_bordo') params.delete('tab');
      else params.set('tab', activeTab);
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams, tabParam, visibleTabs]);

  const def: ListingDef = LISTINGS[activeTab];

  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedFilterState>({});
  const [sort, setSort] = useState<string>(def.defaultSort?.key ?? '');
  const [dir, setDir] = useState<'asc' | 'desc'>(def.defaultSort?.dir ?? 'desc');
  const [page, setPage] = useState(1);

  const [columns, setColumns] = useState<ListingColumn[]>([]);
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [pagination, setPagination] = useState<ListingPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selected, setSelected] = useState<ListingRow | null>(null);

  // Reset per-tab state when switching listing.
  useEffect(() => {
    setSearch('');
    setAdvanced({});
    setSort(def.defaultSort?.key ?? '');
    setDir(def.defaultSort?.dir ?? 'desc');
    setPage(1);
  }, [activeTab, def.defaultSort?.key, def.defaultSort?.dir]);

  const query: ListingQuery = useMemo(() => ({
    q: search || undefined,
    sort: sort || undefined,
    dir,
    page,
    limit: PAGE_SIZE,
    ...advanced,
  }), [search, sort, dir, page, advanced]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await listagensApi.list(activeTab, query);
      setColumns(res.columns);
      setRows(res.data);
      setPagination(res.pagination);
    } catch {
      setError(true);
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, query]);

  // Debounce search; immediate for other changes.
  useEffect(() => {
    const handle = setTimeout(() => { void load(); }, search ? 250 : 0);
    return () => clearTimeout(handle);
  }, [load, search]);

  const changeTab = (key: ListingKey) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'painel_bordo') params.delete('tab');
    else params.set('tab', key);
    setSearchParams(params, { replace: true });
  };

  const handleSort = (key: string) => {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  };

  const kpis = useMemo(() => {
    const resultados = processos.filter((p) => ['Resultado Disponivel', 'Validado', 'Faturado'].includes(p.estado)).length;
    const aFaturar = processos.filter((p) => p.estado === 'Validado').length;
    const faturados = processos.filter((p) => p.estado === 'Faturado');
    return {
      resultados,
      aFaturar,
      faturacao: faturados.length,
      kits: kits.length,
      lotes: lotes.length,
    };
  }, [processos, kits, lotes]);

  const advancedCount = countActiveFilters(advanced);

  const searchPlaceholderKey = `listingsPage.searchPlaceholder.${activeTab}`;
  const searchPlaceholder = t(searchPlaceholderKey) !== searchPlaceholderKey
    ? t(searchPlaceholderKey)
    : def.searchPlaceholder;

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader title={t('pages.listings.title')} subtitle={t('pages.listings.subtitle')}>
          <PageTabsRow
            actions={<ExportMenu listing={activeTab} query={query} count={pagination?.totalRecords ?? 0} />}
          >
            <TabsBar
              active={activeTab}
              onChange={changeTab}
              items={visibleTabs.map((k) => ({ id: k, label: t(`listings.${k}`), icon: LISTINGS[k].icon }))}
            />
          </PageTabsRow>
        </PageHeader>

        <FilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder={searchPlaceholder}
          advanced={def.filters.length > 0 ? (
            <AdvancedFilters def={def} value={advanced} onChange={(next) => { setAdvanced(next); setPage(1); }} />
          ) : undefined}
          advancedCount={advancedCount}
          onClearAdvanced={() => { setAdvanced({}); setPage(1); }}
          right={(
            <button
              type="button"
              onClick={openSearch}
              className={CONTROL.buttonSecondary}
            >
              {t('listingsPage.globalSearch')}
              <kbd className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Ctrl K</kbd>
            </button>
          )}
        />

        <ListingTable
          def={def}
          columns={columns}
          rows={rows}
          pagination={pagination}
          loading={loading}
          error={error}
          sort={sort}
          dir={dir}
          onSort={handleSort}
          onPageChange={setPage}
          onRowClick={setSelected}
        />

        <div className={LAYOUT.kpiGrid}>
          <KpiCard label="Resultados" value={kpis.resultados} icon={FlaskConical} tone="success" onClick={() => changeTab('resultados')} />
          <KpiCard label="A faturar" value={kpis.aFaturar} icon={BadgeCheck} tone="warning" onClick={() => changeTab('faturacao')} />
          <KpiCard label="Faturados" value={kpis.faturacao} icon={Receipt} tone="violet" onClick={() => changeTab('faturacao')} />
          <KpiCard label="Kits" value={kpis.kits} icon={Package} tone="info" onClick={() => changeTab('kits')} />
          <KpiCard label="Lotes" value={kpis.lotes} icon={Boxes} tone="neutral" onClick={() => changeTab('lotes')} />
        </div>
      </div>

      <ListingDetailDrawer
        listing={activeTab}
        row={selected}
        columns={columns}
        def={def}
        onClose={() => setSelected(null)}
        onNavigateTab={(key, q) => {
          changeTab(key);
          if (q !== undefined) setSearch(q);
          setSelected(null);
        }}
      />
    </div>
  );
}
