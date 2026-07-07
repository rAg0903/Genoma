import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, FolderOpen, CalendarClock, FlaskConical, AlertTriangle, Wallet,
  TrendingUp, Clock, Activity, Plus, ArrowRight, Stethoscope,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { formatCalendarDatePt, normalizeCalendarDate } from '../../../lib/dates';
import {
  PROCESS_STATE_COLORS, SURFACE, LAYOUT, PAGE, formatEUR, formatNumber, CONTROL,
} from '../../../lib/design-tokens';
import { PROCESS_STATUS_STYLES, ADD_ACTION_BUTTON_CLASS, SECONDARY_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { isAtivo, isResultadoPorValidar } from '../../../lib/processos';
import { Processo } from '../../data/types';
import { KpiCard } from './KpiCard';
import { ChartCard } from './ChartCard';
import { DashboardPeriod } from './DashboardToolbar';
import { EmptyState } from '../shared/EmptyState';
import { useDashboardData } from './useDashboardData';
import { RefreshCw } from 'lucide-react';
import { processoMatchesMedico } from '../../../lib/process-data-quality';
import { formatUtilizadorGreeting } from '../../../lib/utilizadores';
import { WorkQueuePanel, WorkQueueItem } from '../shared/WorkQueuePanel';

interface OperacionalData {
  kpis: {
    total_contactos?: number;
    processos_ativos: number;
    colheitas_hoje: number;
    colheitas_semana: number;
    resultados_pendentes: number;
    resultados_em_atraso?: number;
    faturacao_mes: number;
  };
  graficos: { processos_por_estado: { estado: string; total: number }[] };
}

const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 0 };

const chartTheme = (isDark: boolean) => ({
  grid: isDark ? '#1e293b' : '#f1f5f9',
  tick: isDark ? '#64748b' : '#94a3b8',
  tooltip: {
    borderRadius: 10,
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    fontSize: 12,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.25)',
  },
});

const yAxisProps = (tickColor: string) => ({
  tick: { fontSize: 11, fill: tickColor },
  axisLine: false as const,
  tickLine: false as const,
  allowDecimals: false as const,
  width: 36,
  tickMargin: 6,
});

const colheitaDate = (p: Processo) => p.data_colheita_prevista || p.data_colheita;

const isHoje = (d?: string) => {
  if (!d) return false;
  const t = new Date(d);
  const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
};

const isEstaSemana = (d?: string) => {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
};

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function MedicoDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t, localeTag } = useLanguage();
  const { currentUser, hasPermission } = useAuth();
  const { contacts, processos } = useData();
  const [period, setPeriod] = useState<DashboardPeriod>('hoje');

  const { data, loading, error, updatedAt, refetch } = useDashboardData<OperacionalData>(
    'operacional',
    t('dashboard.loadError'),
  );

  const theme = chartTheme(isDark);
  const kpis = data?.kpis;
  const canCreateContact = hasPermission('contactos', 'create');

  const colheitasCount = period === 'hoje' ? kpis?.colheitas_hoje : kpis?.colheitas_semana;

  const byEstado = useMemo(() => {
    const source = data?.graficos?.processos_por_estado;
    const base = source && source.length > 0
      ? source
      : Object.keys(PROCESS_STATE_COLORS).map((estado) => ({
          estado,
          total: processos.filter((p) => p.estado === estado).length,
        }));
    return base
      .filter((r) => r.total > 0)
      .map((r) => ({ name: r.estado, total: r.total, fill: PROCESS_STATE_COLORS[r.estado] ?? '#94a3b8' }));
  }, [data, processos]);

  const examEvolution = useMemo(() => {
    const meses: { mes: string; exames: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString(localeTag, { month: 'short' });
      const total = processos.filter((p) => {
        const normalized = normalizeCalendarDate(p.data_entrada);
        if (!normalized) return false;
        const [year, month] = normalized.split('-').map(Number);
        return year === d.getFullYear() && month - 1 === d.getMonth();
      }).length;
      meses.push({ mes: label, exames: total });
    }
    return meses;
  }, [processos, localeTag]);

  const myProcessos = useMemo(
    () => processos.filter((p) => processoMatchesMedico(p, currentUser?.nome)),
    [processos, currentUser?.nome],
  );

  const porValidar = useMemo(
    () => myProcessos.filter(isResultadoPorValidar),
    [myProcessos],
  );

  const colheitasAgendadas = useMemo(() => {
    const matchPeriod = period === 'hoje' ? isHoje : isEstaSemana;
    return myProcessos
      .filter((p) => isAtivo(p) && matchPeriod(colheitaDate(p)))
      .sort((a, b) => (colheitaDate(a) || '').localeCompare(colheitaDate(b) || ''));
  }, [myProcessos, period]);

  const workQueueItems = useMemo(() => {
    const items: WorkQueueItem[] = [];
    porValidar.slice(0, 8).forEach((p) => {
      items.push({
        id: `v-${p.id}`,
        title: p.paciente_nome,
        subtitle: t('ux.workQueue.validateResult'),
        badge: p.numero,
        tone: 'violet',
        icon: FlaskConical,
        onClick: () => navigate(`/processos/${p.id}`),
      });
    });
    colheitasAgendadas.slice(0, 8).forEach((p) => {
      items.push({
        id: `c-${p.id}`,
        title: p.paciente_nome,
        subtitle: t('ux.workQueue.collectionToday'),
        badge: formatCalendarDatePt(colheitaDate(p)),
        tone: 'info',
        icon: CalendarClock,
        onClick: () => navigate(`/processos/${p.id}`),
      });
    });
    return items;
  }, [colheitasAgendadas, navigate, porValidar, t]);

  const recentProcessos = useMemo(
    () => [...processos].sort((a, b) => (b.data_entrada || '').localeCompare(a.data_entrada || '')).slice(0, 5),
    [processos],
  );

  const recentContacts = useMemo(
    () => [...contacts].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5),
    [contacts],
  );

  const medicoKpis = useMemo(() => [
    {
      label: t('dashboard.medico.kpi.patients'),
      value: formatNumber(kpis?.total_contactos ?? contacts.length),
      icon: Users,
      tone: 'neutral' as const,
      hint: t('dashboard.kpi.registeredPatients'),
      onClick: () => navigate('/contactos'),
    },
    {
      label: t('dashboard.kpi.activeProcesses'),
      value: formatNumber(kpis?.processos_ativos ?? processos.filter(isAtivo).length),
      icon: FolderOpen,
      tone: 'brand' as const,
      hint: t('dashboard.kpi.total', { count: processos.length }),
      onClick: () => navigate('/processos'),
    },
    {
      label: period === 'hoje' ? t('dashboard.kpi.collectionsToday') : t('dashboard.kpi.collectionsWeek'),
      value: formatNumber(colheitasCount ?? colheitasAgendadas.length),
      icon: CalendarClock,
      tone: 'info' as const,
      hint: t('dashboard.kpi.scheduled'),
      onClick: () => navigate('/processos'),
    },
    {
      label: t('dashboard.medico.kpi.toValidate'),
      value: formatNumber(kpis?.resultados_pendentes ?? porValidar.length),
      icon: FlaskConical,
      tone: (kpis?.resultados_pendentes ?? porValidar.length) > 0 ? 'violet' as const : 'neutral' as const,
      hint: t('dashboard.kpi.toValidate'),
      onClick: () => navigate('/processos'),
    },
    {
      label: t('dashboard.kpi.overdueResults'),
      value: formatNumber(kpis?.resultados_em_atraso ?? 0),
      icon: AlertTriangle,
      tone: (kpis?.resultados_em_atraso ?? 0) > 0 ? 'danger' as const : 'success' as const,
      hint: t('dashboard.kpi.slaOverdue'),
      onClick: () => navigate('/processos'),
    },
    {
      label: t('dashboard.kpi.monthlyBilling'),
      value: formatEUR(kpis?.faturacao_mes ?? 0),
      icon: Wallet,
      tone: 'success' as const,
      hint: t('dashboard.medico.kpi.billingHint'),
      onClick: () => navigate('/processos'),
    },
  ], [colheitasAgendadas.length, colheitasCount, contacts.length, kpis, navigate, period, porValidar.length, processos, t]);

  const isEmpty = (kpis?.total_contactos ?? contacts.length) === 0 && processos.length === 0;
  const greet = t(`dashboard.medico.greeting.${greetingKey()}`, {
    name: formatUtilizadorGreeting(currentUser ?? {}),
  });

  const periodItems: { id: DashboardPeriod; label: string }[] = [
    { id: 'hoje', label: t('dashboard.periods.hoje') },
    { id: 'semana', label: t('dashboard.periods.semana') },
  ];

  return (
    <div className={`${PAGE.shell} ${LAYOUT.pagePadding} ${LAYOUT.sectionGap} min-h-full`}>
      {/* Cabeçalho personalizado */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0">
            <h1 className={PAGE.title}>{greet}</h1>
            <p className={PAGE.subtitle}>{t('dashboard.medico.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreateContact && (
            <button
              type="button"
              onClick={() => navigate('/contactos/novo')}
              className={ADD_ACTION_BUTTON_CLASS}
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.medico.newContact')}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/processos')}
            className={SECONDARY_ACTION_BUTTON_CLASS}
          >
            {t('dashboard.medico.viewProcesses')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Período + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50">
          {periodItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === item.id
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void refetch()} className={CONTROL.buttonGhost} title={t('common.refresh')}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-xs">
            {updatedAt
              ? updatedAt.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })
              : t('common.refresh')}
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className={`${SURFACE.cardElevated} overflow-hidden`}>
          <EmptyState
            icon={Users}
            title={t('dashboard.medico.empty.title')}
            description={t('dashboard.medico.empty.description')}
            action={
              canCreateContact ? (
                <button type="button" onClick={() => navigate('/contactos/novo')} className={ADD_ACTION_BUTTON_CLASS}>
                  <Plus className="w-4 h-4" />
                  {t('dashboard.medico.empty.action')}
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 ${LAYOUT.gridGap}`}>
            {medicoKpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-3 ${LAYOUT.gridGap}`}>
            <ChartCard
              className="lg:col-span-2"
              title={t('dashboard.charts.processPipeline')}
              subtitle={t('dashboard.medico.pipelineSub')}
              icon={Activity}
            >
              {byEstado.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                  {t('dashboard.charts.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byEstado} barSize={34} margin={CHART_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: theme.tick }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis {...yAxisProps(theme.tick)} />
                    <Tooltip contentStyle={theme.tooltip} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {byEstado.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <WorkQueuePanel
              className="lg:col-span-1"
              title={t('ux.workQueue.medicoTitle')}
              subtitle={t('ux.workQueue.medicoSubtitle')}
              items={workQueueItems}
              emptyMessage={t('ux.workQueue.empty')}
            />
          </div>

          <ChartCard
            title={t('dashboard.charts.processEvolution')}
            subtitle={t('dashboard.medico.evolutionSub')}
            icon={TrendingUp}
          >
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={examEvolution} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient id="medicoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={isDark ? 0.3 : 0.18} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
                <YAxis {...yAxisProps(theme.tick)} />
                <Tooltip contentStyle={theme.tooltip} />
                <Area type="monotone" dataKey="exames" stroke="#0d9488" strokeWidth={2.5} fill="url(#medicoGrad)" dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.gridGap} pb-2`}>
            <div className={`${SURFACE.cardElevated} overflow-hidden`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">
                    {t('dashboard.charts.recentProcesses')}
                  </h3>
                  <button type="button" onClick={() => navigate('/processos')} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 text-xs font-medium">
                    {t('common.viewAll')}
                  </button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {recentProcessos.length === 0 ? (
                    <p className="px-5 py-6 text-center text-xs text-slate-400">{t('dashboard.charts.noData')}</p>
                  ) : (
                    recentProcessos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigate(`/processos/${p.id}`)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-900 dark:text-slate-100 text-[13px] font-medium">{p.numero}</div>
                          <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{p.paciente_nome}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PROCESS_STATUS_STYLES[p.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                            {p.estado}
                          </span>
                          <span className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {formatCalendarDatePt(p.data_entrada)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className={`${SURFACE.cardElevated} overflow-hidden`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">
                    {t('dashboard.charts.recentContacts')}
                  </h3>
                  <button type="button" onClick={() => navigate('/contactos')} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 text-xs font-medium">
                    {t('common.viewAll')}
                  </button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {recentContacts.length === 0 ? (
                    <p className="px-5 py-6 text-center text-xs text-slate-400">{t('dashboard.charts.noData')}</p>
                  ) : (
                    recentContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => navigate(`/contactos/${c.id}`)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 dark:text-teal-400 text-xs font-semibold">
                            {c.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-900 dark:text-slate-100 text-[13px] font-medium">{c.nome}</div>
                          <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{c.email}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
