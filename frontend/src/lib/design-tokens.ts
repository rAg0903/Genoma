/**
 * Genoma CRM — Design System Tokens
 * --------------------------------------------------------------------------
 * Fonte unica de verdade para a linguagem visual do CRM (estilo enterprise,
 * clean e clinico). Pensado para Tailwind CSS + shadcn/Radix.
 *
 * Filosofia (inspirada em Linear / Monday / Salesforce / HubSpot / Notion,
 * adaptada ao contexto clinico-laboratorial):
 *  - Superficies neutras (slate) + 1 cor de marca (teal clinico).
 *  - Cor usada com intencao: estado/semantica, nunca decorativa.
 *  - Densidade de informacao alta mas com respiro (espacamento 4px base).
 *  - Tipografia compacta, hierarquia clara, numeros em destaque.
 */

// ----------------------------------------------------------------------------
// 1. CORES
// ----------------------------------------------------------------------------
export const COLORS = {
  // Marca (clinico / confianca)
  brand: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a',
  },
  // Superficie / neutros
  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a',
  },
  // Semantica
  info: '#0284c7', // sky-600
  success: '#059669', // emerald-600
  warning: '#d97706', // amber-600
  danger: '#e11d48', // rose-600
} as const;

// ----------------------------------------------------------------------------
// 2. TIPOGRAFIA  (escala compacta, enterprise)
// ----------------------------------------------------------------------------
export const TYPOGRAPHY = {
  fontFamily: "'Segoe UI', system-ui, -apple-system, 'Inter', sans-serif",
  // role -> classes tailwind
  display: 'text-2xl font-semibold tracking-tight',   // 24px — titulo de pagina
  title: 'text-lg font-semibold tracking-tight',      // 18px — titulo de seccao
  subtitle: 'text-sm font-medium',                    // 14px
  body: 'text-sm',                                    // 14px
  caption: 'text-xs text-slate-500 dark:text-slate-400', // 12px
  metric: 'text-xl font-bold tracking-tight tabular-nums', // KPIs
  metricSm: 'text-lg font-bold tracking-tight tabular-nums',
} as const;

// ----------------------------------------------------------------------------
// 3. ESPACAMENTO / RAIO / SOMBRA  (base 4px)
// ----------------------------------------------------------------------------
export const LAYOUT = {
  pagePadding: 'p-3 md:p-5',
  sectionGap: 'space-y-4 md:space-y-5',
  gridGap: 'gap-2.5 md:gap-3',
  /** KPIs preenchem a largura; linhas incompletas expandem os cartões proporcionalmente. */
  kpiGrid: 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2.5 md:gap-3 items-stretch',
  radiusCard: 'rounded-xl',
  radiusControl: 'rounded-lg',
  radiusPill: 'rounded-full',
} as const;

export const CARD = {
  padding: 'p-3',
  paddingComfort: 'px-3.5 py-3',
  iconBox: 'w-9 h-9 rounded-lg',
  iconSize: 'w-4 h-4',
} as const;

export const SURFACE = {
  // Cartao padrao
  card:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl',
  // Cartao com leve elevacao
  cardElevated:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm',
  // Cartao interativo (hover)
  cardInteractive:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-[0_10px_30px_-18px_rgba(13,148,136,0.45)]',
  // Fundo da area de trabalho
  canvas: 'bg-slate-50 dark:bg-slate-950',
} as const;

/** Contentor e corpo de pagina (alinhado com o Painel). */
export const PAGE = {
  shell:
    'flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden',
  body: `flex flex-col flex-1 ${LAYOUT.pagePadding} ${LAYOUT.sectionGap}`,
  title: 'text-slate-900 dark:text-slate-100 text-2xl font-semibold tracking-tight',
  subtitle: 'text-slate-500 dark:text-slate-400 text-[13px] mt-1',
} as const;

/** Tabs deslizantes (cápsula #0f172b + texto branco). */
export const TAB = {
  track: 'relative inline-flex gap-0.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50',
  indicator:
    'pointer-events-none absolute top-1 bottom-1 rounded-lg bg-[#0f172b] dark:bg-slate-100 shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  active: 'font-semibold text-white dark:text-[#0f172b]',
  inactive: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
  activeIcon: 'text-white dark:text-[#0f172b]',
  inactiveIcon: 'text-slate-400 dark:text-slate-500',
  activeCount: 'bg-white/20 dark:bg-slate-900/15 text-white dark:text-[#0f172b]',
} as const;

/** Painéis de listagem / tabelas */
export const PANEL = {
  table:
    'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden',
  tableHead: 'bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800',
} as const;

// ----------------------------------------------------------------------------
// 4. ESTADOS / SEMANTICA  (badges, alertas)
// ----------------------------------------------------------------------------
export type AlertLevel = 'critico' | 'aviso' | 'info' | 'sucesso';

export const ALERT_STYLES: Record<AlertLevel, { container: string; dot: string; label: string }> = {
  critico: {
    container: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50',
    dot: 'bg-rose-500',
    label: 'text-rose-700 dark:text-rose-300',
  },
  aviso: {
    container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
    dot: 'bg-amber-500',
    label: 'text-amber-700 dark:text-amber-300',
  },
  info: {
    container: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50',
    dot: 'bg-sky-500',
    label: 'text-sky-700 dark:text-sky-300',
  },
  sucesso: {
    container: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
    dot: 'bg-emerald-500',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
};

// Acento visual por tipo de KPI (icone + realce)
export type KpiTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

export const KPI_TONES: Record<KpiTone, { iconBg: string; icon: string; ring: string }> = {
  brand: { iconBg: 'bg-teal-100 dark:bg-teal-900/30', icon: 'text-teal-600 dark:text-teal-400', ring: 'group-hover:border-teal-300 dark:group-hover:border-teal-700' },
  info: { iconBg: 'bg-sky-100 dark:bg-sky-900/30', icon: 'text-sky-600 dark:text-sky-400', ring: 'group-hover:border-sky-300 dark:group-hover:border-sky-700' },
  success: { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700' },
  warning: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', ring: 'group-hover:border-amber-300 dark:group-hover:border-amber-700' },
  danger: { iconBg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', ring: 'group-hover:border-rose-300 dark:group-hover:border-rose-700' },
  violet: { iconBg: 'bg-violet-100 dark:bg-violet-900/30', icon: 'text-violet-600 dark:text-violet-400', ring: 'group-hover:border-violet-300 dark:group-hover:border-violet-700' },
  neutral: { iconBg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-600 dark:text-slate-300', ring: 'group-hover:border-slate-300 dark:group-hover:border-slate-600' },
};

// Paleta para os estados do processo (alinhada com a maquina de estados)
export const PROCESS_STATE_COLORS: Record<string, string> = {
  Agendado: '#f59e0b',
  'Kit Reservado': '#eab308',
  'Colheita Realizada': '#6366f1',
  'Enviado Laboratorio': '#3b82f6',
  'Em Analise': '#8b5cf6',
  'Resultado Disponivel': '#10b981',
  Validado: '#22c55e',
  Faturado: '#0d9488',
  Cancelado: '#ef4444',
};

// Cores de carga do calendario de agendamentos (CRM antigo)
export const CALENDAR_LOAD_COLORS: Record<string, string> = {
  cinza: '#cbd5e1',
  verde: '#22c55e',
  amarelo: '#eab308',
  vermelho: '#ef4444',
};

// ----------------------------------------------------------------------------
// 5. CONTROLOS (inputs, botoes)
// ----------------------------------------------------------------------------
export const CONTROL = {
  input:
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition',
  buttonPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 transition disabled:opacity-50',
  buttonGhost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition',
  buttonSecondary:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition',
  searchInput:
    'w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition',
  segment:
    'relative inline-flex gap-0.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50',
  segmentItem:
    'relative z-10 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200',
  segmentItemActive:
    'font-semibold text-white dark:text-[#0f172b]',
  segmentIndicator:
    'pointer-events-none absolute top-1 bottom-1 rounded-lg bg-[#0f172b] dark:bg-slate-100 shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  segmentItemIdle:
    'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
} as const;

/** Campos de formulário (páginas e modais). */
export const FORM = {
  label: 'block mb-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-400',
  hint: 'mt-1 text-xs text-slate-500 dark:text-slate-400',
  stack: 'space-y-4',
  alertInfo:
    'rounded-lg border border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/30 px-3 py-2 text-xs leading-relaxed text-sky-800 dark:text-sky-300',
  alertWarning:
    'rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300',
  checkboxRow:
    'flex items-start gap-2.5 text-[13px] leading-snug text-slate-700 dark:text-slate-200 cursor-pointer select-none',
  checkbox:
    'mt-0.5 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500/40',
} as const;

// Helpers de formatacao
export const formatEUR = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-PT').format(value || 0);
