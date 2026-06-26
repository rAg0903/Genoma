import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FolderOpen, CalendarClock, FlaskConical, Package, Wallet, AlertTriangle,
  TrendingUp, Clock, Activity, Stethoscope, Microscope, Euro, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../lib/api';
import { formatCalendarDatePt, normalizeCalendarDate } from '../../lib/dates';
import {
  PROCESS_STATE_COLORS, SURFACE, LAYOUT, PAGE, formatEUR, formatNumber,
} from '../../lib/design-tokens';
import { KpiCard } from './dashboard/KpiCard';
import { ChartCard } from './dashboard/ChartCard';
import { AlertPanel, DashboardAlert } from './dashboard/AlertPanel';
import {
  DashboardToolbar, DashboardScope, DashboardPeriod,
} from './dashboard/DashboardToolbar';
import { PROCESS_STATUS_STYLES } from '../../lib/design-system';

const AUTH_TOKEN_KEYS = ['token', 'authToken', 'jwtToken', 'access_token'];
const getAuthToken = () => {
  if (typeof window === 'undefined') return undefined;
  for (const key of AUTH_TOKEN_KEYS) {
    const v = window.localStorage.getItem(key);
    if (v) return v;
  }
  return undefined;
};

// --- Tipos das respostas de dashboard ------------------------------------
interface ApiAlerta { nivel: 'critico' | 'aviso' | 'info'; mensagem: string }
interface OperacionalData {
  kpis: {
    total_contactos?: number;
    processos_ativos: number; colheitas_hoje: number; colheitas_semana: number;
    resultados_pendentes: number; resultados_em_atraso?: number; kits_disponiveis: number; lotes_ativos: number;
    faturacao_mes: number; faturas_nao_emitidas?: number; faturas_nao_pagas?: number; alertas_criticos: number;
  };
  graficos: { processos_por_estado: { estado: string; total: number }[] };
  alertas: ApiAlerta[];
}

const SCOPES_BY_ROLE: Record<string, DashboardScope[]> = {
  Administrador: ['operacional', 'laboratorial', 'financeiro', 'executivo'],
  Medico: ['operacional', 'laboratorial'],
  Assistente: ['operacional'],
};

function useDashboardData<T>(scope: DashboardScope, loadErrorLabel: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: T }>(`/dashboards/${scope}`, { token: getAuthToken() });
      setData(res.data);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : loadErrorLabel);
    } finally {
      setLoading(false);
    }
  }, [scope, loadErrorLabel]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, updatedAt, refetch };
}

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

const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 0 };

const yAxisProps = (tickColor: string) => ({
  tick: { fontSize: 11, fill: tickColor },
  axisLine: false as const,
  tickLine: false as const,
  allowDecimals: false as const,
  width: 36,
  tickMargin: 6,
});

export function DashboardPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t, localeTag } = useLanguage();
  const { contacts, processos, kits } = useData();

  const availableScopes = SCOPES_BY_ROLE[role] ?? ['operacional'];
  const [scope, setScope] = useState<DashboardScope>('operacional');
  const [period, setPeriod] = useState<DashboardPeriod>('hoje');

  useEffect(() => {
    if (!availableScopes.includes(scope)) setScope(availableScopes[0]);
  }, [availableScopes, scope]);

  const { data, loading, error, updatedAt, refetch } = useDashboardData<OperacionalData>(scope, t('dashboard.loadError'));
  const theme = chartTheme(isDark);

  // ---- Fallbacks calculados no cliente (caso a API falhe) ----------------
  const fallback = useMemo(() => {
    const ativos = processos.filter((p) => p.estado !== 'Cancelado' && p.estado !== 'Faturado').length;
    const resultadosPendentes = processos.filter((p) => p.estado === 'Resultado Disponivel').length;
    const kitsDisponiveis = kits.filter((k) => k.status === 'Disponível').length;
    return { ativos, resultadosPendentes, kitsDisponiveis };
  }, [processos, kits]);

  const kpis = data?.kpis;
  const colheitas = period === 'hoje' ? kpis?.colheitas_hoje : kpis?.colheitas_semana;

  // ---- Graficos derivados -------------------------------------------------
  const byEstado = useMemo(() => {
    const source = data?.graficos?.processos_por_estado;
    const base = source && source.length > 0
      ? source
      : Object.keys(PROCESS_STATE_COLORS).map((estado) => ({
          estado, total: processos.filter((p) => p.estado === estado).length,
        }));
    return base.map((r) => ({ name: r.estado, total: r.total, fill: PROCESS_STATE_COLORS[r.estado] ?? '#94a3b8' }));
  }, [data, processos]);

  const kitPie = useMemo(() => ([
    { name: t('dashboard.kitStatus.available'), value: kits.filter((k) => k.status === 'Disponível').length, color: '#10b981' },
    { name: t('dashboard.kitStatus.reserved'), value: kits.filter((k) => k.status === 'Reservado').length, color: '#f59e0b' },
    { name: t('dashboard.kitStatus.inTransit'), value: kits.filter((k) => k.status === 'Em trânsito').length, color: '#3b82f6' },
    { name: t('dashboard.kitStatus.used'), value: kits.filter((k) => k.status === 'Utilizado').length, color: '#94a3b8' },
    { name: t('dashboard.kitStatus.invalid'), value: kits.filter((k) => k.status === 'Inválido').length, color: '#ef4444' },
    { name: t('dashboard.kitStatus.expired'), value: kits.filter((k) => k.status === 'Expirado').length, color: '#f97316' },
  ].filter((k) => k.value > 0)), [kits, t]);

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

  const recentProcessos = useMemo(
    () => [...processos].sort((a, b) => (b.data_entrada || '').localeCompare(a.data_entrada || '')).slice(0, 6),
    [processos],
  );
  const recentContacts = useMemo(
    () => [...contacts].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 6),
    [contacts],
  );

  // ---- Alertas ------------------------------------------------------------
  const alerts: DashboardAlert[] = useMemo(() => {
    const apiAlerts = data?.alertas ?? [];
    if (apiAlerts.length > 0) {
      return apiAlerts.map((a, i) => ({
        id: `api-${i}`,
        nivel: a.nivel,
        titulo: a.mensagem,
        onClick:
          a.mensagem.toLowerCase().includes('kit') ? () => navigate('/stocks')
          : a.mensagem.toLowerCase().includes('processo') ? () => navigate('/processos')
          : undefined,
      }));
    }
    const built: DashboardAlert[] = [];
    if (fallback.kitsDisponiveis <= 5) {
      built.push({ id: 'kits', nivel: 'critico', titulo: t('dashboard.alerts.lowKitStock'), descricao: t('dashboard.alerts.restock'), total: fallback.kitsDisponiveis, onClick: () => navigate('/stocks') });
    }
    if (fallback.resultadosPendentes > 0) {
      built.push({ id: 'res', nivel: 'info', titulo: t('dashboard.alerts.pendingValidation'), total: fallback.resultadosPendentes, onClick: () => navigate('/processos') });
    }
    return built;
  }, [data, fallback, navigate, t]);

  // ---- KPIs operacionais (7 widgets pedidos) ------------------------------
  const operacionalKpis = useMemo(() => [
    { label: t('dashboard.kpi.totalContacts'), value: formatNumber(kpis?.total_contactos ?? contacts.length), icon: Users, tone: 'neutral' as const, hint: t('dashboard.kpi.registeredPatients'), onClick: () => navigate('/contactos') },
    { label: t('dashboard.kpi.activeProcesses'), value: formatNumber(kpis?.processos_ativos ?? fallback.ativos), icon: FolderOpen, tone: 'brand' as const, hint: t('dashboard.kpi.total', { count: processos.length }), onClick: () => navigate('/processos') },
    { label: period === 'hoje' ? t('dashboard.kpi.collectionsToday') : t('dashboard.kpi.collectionsWeek'), value: formatNumber(colheitas ?? 0), icon: CalendarClock, tone: 'info' as const, hint: t('dashboard.kpi.scheduled'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.pendingResults'), value: formatNumber(kpis?.resultados_pendentes ?? fallback.resultadosPendentes), icon: FlaskConical, tone: 'violet' as const, hint: t('dashboard.kpi.toValidate'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.overdueResults'), value: formatNumber(kpis?.resultados_em_atraso ?? 0), icon: AlertTriangle, tone: (kpis?.resultados_em_atraso ?? 0) > 0 ? 'danger' as const : 'success' as const, hint: t('dashboard.kpi.slaOverdue'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.availableKits'), value: formatNumber(kpis?.kits_disponiveis ?? fallback.kitsDisponiveis), icon: Package, tone: (kpis?.kits_disponiveis ?? fallback.kitsDisponiveis) <= 5 ? 'danger' as const : 'success' as const, hint: t('dashboard.kpi.inInventory', { count: kits.length }), onClick: () => navigate('/stocks') },
    { label: t('dashboard.kpi.invoicesToIssue'), value: formatNumber(kpis?.faturas_nao_emitidas ?? 0), icon: Wallet, tone: (kpis?.faturas_nao_emitidas ?? 0) > 0 ? 'warning' as const : 'neutral' as const, hint: t('dashboard.kpi.validatedNoInvoice'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.invoicesToPay'), value: formatNumber(kpis?.faturas_nao_pagas ?? 0), icon: Wallet, tone: (kpis?.faturas_nao_pagas ?? 0) > 0 ? 'warning' as const : 'neutral' as const, hint: t('dashboard.kpi.issuedUnpaid'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.monthlyBilling'), value: formatEUR(kpis?.faturacao_mes ?? 0), icon: Wallet, tone: 'success' as const, hint: t('dashboard.kpi.issuedInvoices'), onClick: () => navigate('/processos') },
    { label: t('dashboard.kpi.criticalAlerts'), value: formatNumber(kpis?.alertas_criticos ?? alerts.filter((a) => a.nivel === 'critico').length), icon: AlertTriangle, tone: 'danger' as const, hint: t('dashboard.kpi.needsAction') },
  ], [alerts, colheitas, contacts.length, fallback, kits.length, kpis, navigate, period, processos.length, t]);

  return (
    <div className={`${PAGE.shell} ${LAYOUT.pagePadding} ${LAYOUT.sectionGap} min-h-full`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className={PAGE.title}>{t('dashboard.title')}</h1>
          <p className={PAGE.subtitle}>
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            {error ? t('dashboard.offline') : t('dashboard.online')}
          </span>
        </div>
      </div>

      {/* Toolbar / filtros / perfil */}
      <DashboardToolbar
        scopes={availableScopes}
        scope={scope}
        onScopeChange={setScope}
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={() => void refetch()}
        loading={loading}
        updatedAt={updatedAt}
      />

      {scope === 'operacional' ? (
        <>
          {/* KPI grid — 7 widgets */}
          <div className={LAYOUT.kpiGrid}>
            {operacionalKpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          {/* Linha de graficos */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 ${LAYOUT.gridGap}`}>
            <ChartCard className="lg:col-span-2" title={t('dashboard.charts.processPipeline')} subtitle={t('dashboard.charts.processPipelineSub')} icon={Activity}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byEstado} barSize={34} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.tick }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
                  <YAxis {...yAxisProps(theme.tick)} />
                  <Tooltip contentStyle={theme.tooltip} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {byEstado.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <AlertPanel alerts={alerts} />
          </div>

          {/* Evolucao + kits */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 ${LAYOUT.gridGap}`}>
            <ChartCard
              className="lg:col-span-2"
              title={t('dashboard.charts.processEvolution')}
              subtitle={t('dashboard.charts.last6Months')}
              icon={TrendingUp}
            >
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={examEvolution} margin={CHART_MARGIN}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={isDark ? 0.3 : 0.18} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
                  <YAxis {...yAxisProps(theme.tick)} />
                  <Tooltip contentStyle={theme.tooltip} />
                  <Area type="monotone" dataKey="exames" stroke="#0d9488" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('dashboard.charts.kitStatus')} subtitle={t('dashboard.kpi.inInventory', { count: kits.length })} icon={Package}>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={kitPie} cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={3} dataKey="value">
                    {kitPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={theme.tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {kitPie.map((k) => (
                  <div key={k.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{k.name} ({k.value})</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Listas recentes */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${LAYOUT.gridGap} pb-2`}>
            <div className={`${SURFACE.cardElevated} overflow-hidden`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">{t('dashboard.charts.recentProcesses')}</h3>
                <button onClick={() => navigate('/processos')} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 text-xs font-medium">{t('common.viewAll')}</button>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentProcessos.map((p) => (
                  <button key={p.id} onClick={() => navigate('/processos')} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900 dark:text-slate-100 text-[13px] font-medium">{p.numero}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{p.paciente_nome}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PROCESS_STATUS_STYLES[p.estado] ?? 'bg-slate-100 text-slate-600'}`}>{p.estado}</span>
                      <span className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {formatCalendarDatePt(p.data_entrada)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${SURFACE.cardElevated} overflow-hidden`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">{t('dashboard.charts.recentContacts')}</h3>
                <button onClick={() => navigate('/contactos')} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 text-xs font-medium">{t('common.viewAll')}</button>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentContacts.map((c) => (
                  <button key={c.id} onClick={() => navigate('/contactos')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 dark:text-teal-400 text-xs font-semibold">{c.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900 dark:text-slate-100 text-[13px] font-medium">{c.nome}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{c.email}</div>
                    </div>
                    <span className="text-slate-400 text-[11px] flex-shrink-0 hidden sm:block">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString(localeTag, { day: '2-digit', month: 'short' }) : '—'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <ScopeView scope={scope} theme={theme} isDark={isDark} />
      )}
    </div>
  );
}

// --- Vistas compactas para os restantes perfis ---------------------------
type AnyDash = { kpis: Record<string, number>; graficos: Record<string, unknown>; alertas: ApiAlerta[] };

const SCOPE_KPI_META_KEYS: Record<Exclude<DashboardScope, 'operacional'>, { key: string; labelKey: string; icon: typeof Euro; money?: boolean; tone: 'brand' | 'success' | 'info' | 'violet' | 'warning' | 'neutral' }[]> = {
  laboratorial: [
    { key: 'em_laboratorio', labelKey: 'dashboard.scopeKpi.inLab', icon: Microscope, tone: 'info' },
    { key: 'resultados_por_validar', labelKey: 'dashboard.scopeKpi.toValidate', icon: FlaskConical, tone: 'violet' },
    { key: 'tat_medio_dias', labelKey: 'dashboard.scopeKpi.avgTat', icon: Clock, tone: 'warning' },
    { key: 'percentagem_anomalias', labelKey: 'dashboard.scopeKpi.anomalyRate', icon: Activity, tone: 'neutral' },
  ],
  financeiro: [
    { key: 'faturacao_mes', labelKey: 'dashboard.scopeKpi.monthlyBilling', icon: Wallet, money: true, tone: 'success' },
    { key: 'pendente_recebimento', labelKey: 'dashboard.scopeKpi.toReceive', icon: Euro, money: true, tone: 'warning' },
    { key: 'recebido_total', labelKey: 'dashboard.scopeKpi.totalReceived', icon: TrendingUp, money: true, tone: 'brand' },
    { key: 'ticket_medio', labelKey: 'dashboard.scopeKpi.avgTicket', icon: Euro, money: true, tone: 'info' },
  ],
  executivo: [
    { key: 'total_processos', labelKey: 'dashboard.scopeKpi.totalProcesses', icon: FolderOpen, tone: 'brand' },
    { key: 'processos_mes', labelKey: 'dashboard.scopeKpi.monthlyProcesses', icon: Activity, tone: 'info' },
    { key: 'medicos_ativos', labelKey: 'dashboard.scopeKpi.activeDoctors', icon: Stethoscope, tone: 'violet' },
    { key: 'receita_total', labelKey: 'dashboard.scopeKpi.totalRevenue', icon: Wallet, money: true, tone: 'success' },
  ],
};

function ScopeView({ scope, theme, isDark }: { scope: DashboardScope; theme: ReturnType<typeof chartTheme>; isDark: boolean }) {
  const { t } = useLanguage();
  const { data, loading, error, alerts } = useScopeData(scope, t('dashboard.loadError'));
  const meta = SCOPE_KPI_META_KEYS[scope as Exclude<DashboardScope, 'operacional'>] ?? [];

  if (loading && !data) {
    return <div className={`${SURFACE.cardElevated} p-10 text-center text-sm text-slate-500`}>{t('common.loading')}</div>;
  }
  if (error && !data) {
    return <div className={`${SURFACE.cardElevated} p-10 text-center text-sm text-rose-500`}>{t('dashboard.loadScopeError')}</div>;
  }

  return (
    <>
      <div className={LAYOUT.kpiGrid}>
        {meta.map((m) => (
          <KpiCard
            key={m.key}
            label={t(m.labelKey)}
            value={m.money ? formatEUR(data?.kpis?.[m.key] ?? 0) : formatNumber(data?.kpis?.[m.key] ?? 0)}
            icon={m.icon}
            tone={m.tone}
          />
        ))}
      </div>
      <div className={`grid grid-cols-1 lg:grid-cols-3 ${LAYOUT.gridGap}`}>
        <ChartCard className="lg:col-span-2" title={t('dashboard.charts.trend')} subtitle={t('dashboard.charts.recentPeriod')} icon={TrendingUp}>
          <ScopeChart scope={scope} data={data} theme={theme} isDark={isDark} noDataLabel={t('dashboard.charts.noData')} />
        </ChartCard>
        <AlertPanel alerts={alerts} />
      </div>
    </>
  );
}

function useScopeData(scope: DashboardScope, loadErrorLabel: string) {
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardData<AnyDash>(scope, loadErrorLabel);
  const alerts: DashboardAlert[] = (data?.alertas ?? []).map((a, i) => ({
    id: `s-${i}`, nivel: a.nivel, titulo: a.mensagem,
    onClick: a.mensagem.toLowerCase().includes('kit') ? () => navigate('/stocks') : undefined,
  }));
  return { data, loading, error, alerts };
}

function ScopeChart({ scope, data, theme, isDark, noDataLabel }: { scope: DashboardScope; data: AnyDash | null; theme: ReturnType<typeof chartTheme>; isDark: boolean; noDataLabel: string }) {
  let series: { label: string; value: number }[] = [];
  if (scope === 'financeiro') {
    series = ((data?.graficos?.receita_por_mes as { mes: string; total: number }[]) ?? []).map((r) => ({ label: r.mes, value: r.total }));
  } else if (scope === 'laboratorial') {
    series = ((data?.graficos?.anomalias_por_cromossoma as { cromossoma: string; total: number }[]) ?? []).map((r) => ({ label: r.cromossoma, value: r.total }));
  } else {
    series = ((data?.graficos?.processos_por_mes as { mes: string; total: number }[]) ?? []).map((r) => ({ label: r.mes, value: r.total }));
  }

  if (series.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">{noDataLabel}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={series} margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="scopeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d9488" stopOpacity={isDark ? 0.3 : 0.18} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
        <YAxis {...yAxisProps(theme.tick)} />
        <Tooltip contentStyle={theme.tooltip} />
        <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2.5} fill="url(#scopeGrad)" dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
