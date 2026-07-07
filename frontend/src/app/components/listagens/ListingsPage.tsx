import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FlaskConical, Receipt, Package, Boxes, BadgeCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { PageHeader } from '../shared/PageHeader';
import { PageTabsRow } from '../shared/PageToolbar';
import { TabsBar } from '../shared/TabsBar';
import { FilterBar } from '../shared/FilterBar';
import { KpiCard } from '../dashboard/KpiCard';
import { LAYOUT, PAGE } from '../../../lib/design-tokens';
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

type ListingSnapshot = {
  columns: ListingColumn[];
  rows: ListingRow[];
  pagination: ListingPagination | null;
  search: string;
  advanced: AdvancedFilterState;
  sort: string;
  dir: 'asc' | 'desc';
  page: number;
};

type ListingTabContentProps = {
  tab: ListingKey;
  snapshot?: ListingSnapshot;
  onSnapshot: (tab: ListingKey, data: ListingSnapshot) => void;
  onRowClick: (row: ListingRow) => void;
};

function ListingTabContent({ tab, snapshot, onSnapshot, onRowClick }: ListingTabContentProps) {
  const { t } = useLanguage();
  const def = LISTINGS[tab];

  const [search, setSearch] = useState(snapshot?.search ?? '');
  const [advanced, setAdvanced] = useState<AdvancedFilterState>(snapshot?.advanced ?? {});
  const [sort, setSort] = useState(snapshot?.sort ?? def.defaultSort?.key ?? '');
  const [dir, setDir] = useState<'asc' | 'desc'>(snapshot?.dir ?? def.defaultSort?.dir ?? 'desc');
  const [page, setPage] = useState(snapshot?.page ?? 1);

  const [columns, setColumns] = useState<ListingColumn[]>(snapshot?.columns ?? []);
  const [rows, setRows] = useState<ListingRow[]>(snapshot?.rows ?? []);
  const [pagination, setPagination] = useState<ListingPagination | null>(snapshot?.pagination ?? null);
  const [loading, setLoading] = useState(!snapshot?.rows?.length);
  const [error, setError] = useState(false);

  const loadSeqRef = useRef(0);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const query: ListingQuery = useMemo(() => ({
    q: search || undefined,
    sort: sort || undefined,
    dir,
    page,
    limit: PAGE_SIZE,
    ...advanced,
  }), [search, sort, dir, page, advanced]);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const hasRows = rowsRef.current.length > 0;
    if (!hasRows) setLoading(true);
    setError(false);

    try {
      const res = await listagensApi.list(tab, query);
      if (seq !== loadSeqRef.current) return;

      setColumns(res.columns);
      setRows(res.data);
      setPagination(res.pagination);
      onSnapshot(tab, {
        columns: res.columns,
        rows: res.data,
        pagination: res.pagination,
        search,
        advanced,
        sort,
        dir,
        page,
      });
    } catch {
      if (seq !== loadSeqRef.current) return;
      setError(true);
      if (!hasRows) {
        setRows([]);
        setPagination(null);
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [tab, query, search, advanced, sort, dir, page, onSnapshot]);

  useEffect(() => {
    const handle = setTimeout(() => { void load(); }, search ? 250 : 0);
    return () => clearTimeout(handle);
  }, [load, search]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  };

  const advancedCount = countActiveFilters(advanced);
  const searchPlaceholderKey = `listingsPage.searchPlaceholder.${tab}`;
  const searchPlaceholder = t(searchPlaceholderKey) !== searchPlaceholderKey
    ? t(searchPlaceholderKey)
    : def.searchPlaceholder;

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={searchPlaceholder}
        advanced={def.filters.length > 0 ? (
          <AdvancedFilters def={def} value={advanced} onChange={(next) => { setAdvanced(next); setPage(1); }} />
        ) : undefined}
        advancedCount={advancedCount}
        onClearAdvanced={() => { setAdvanced({}); setPage(1); }}
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
        onRowClick={onRowClick}
      />
    </>
  );
}

export function ListingsPage() {
  const { t } = useLanguage();
  const { hasListingsSubmodulePermission } = useAuth();
  const { processos, kits, lotes } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabCacheRef = useRef<Partial<Record<ListingKey, ListingSnapshot>>>({});

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
  const [selected, setSelected] = useState<ListingRow | null>(null);

  const changeTab = (key: ListingKey) => {
    setSelected(null);
    const params = new URLSearchParams(searchParams);
    if (key === 'painel_bordo') params.delete('tab');
    else params.set('tab', key);
    setSearchParams(params, { replace: true });
  };

  const handleSnapshot = useCallback((tab: ListingKey, data: ListingSnapshot) => {
    tabCacheRef.current[tab] = data;
  }, []);

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

  const exportQuery: ListingQuery = useMemo(() => {
    const snap = tabCacheRef.current[activeTab];
    return {
      q: snap?.search || undefined,
      sort: snap?.sort || def.defaultSort?.key || undefined,
      dir: snap?.dir ?? def.defaultSort?.dir ?? 'desc',
      page: snap?.page ?? 1,
      limit: PAGE_SIZE,
      ...(snap?.advanced ?? {}),
    };
  }, [activeTab, def.defaultSort?.dir, def.defaultSort?.key]);

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader title={t('pages.listings.title')} subtitle={t('pages.listings.subtitle')}>
          <PageTabsRow
            actions={(
              <ExportMenu
                listing={activeTab}
                query={exportQuery}
                count={tabCacheRef.current[activeTab]?.pagination?.totalRecords ?? 0}
              />
            )}
          >
            <TabsBar
              active={activeTab}
              onChange={changeTab}
              instant
              items={visibleTabs.map((k) => ({ id: k, label: t(`listings.${k}`), icon: LISTINGS[k].icon }))}
            />
          </PageTabsRow>
        </PageHeader>

        <ListingTabContent
          key={activeTab}
          tab={activeTab}
          snapshot={tabCacheRef.current[activeTab]}
          onSnapshot={handleSnapshot}
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
        columns={tabCacheRef.current[activeTab]?.columns ?? []}
        def={def}
        onClose={() => setSelected(null)}
        onNavigateTab={(key, q) => {
          changeTab(key);
          if (q !== undefined) {
            tabCacheRef.current[key] = {
              ...(tabCacheRef.current[key] ?? {
                columns: [],
                rows: [],
                pagination: null,
                advanced: {},
                sort: LISTINGS[key].defaultSort?.key ?? '',
                dir: LISTINGS[key].defaultSort?.dir ?? 'desc',
                page: 1,
              }),
              search: q,
            };
          }
          setSelected(null);
        }}
      />
    </div>
  );
}
