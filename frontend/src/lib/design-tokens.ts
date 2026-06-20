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
  metric: 'text-3xl font-bold tracking-tight tabular-nums', // KPIs
  metricSm: 'text-2xl font-bold tracking-tight tabular-nums',
} as const;

// ----------------------------------------------------------------------------
// 3. ESPACAMENTO / RAIO / SOMBRA  (base 4px)
// ----------------------------------------------------------------------------
export const LAYOUT = {
  pagePadding: 'p-4 md:p-6',
  sectionGap: 'space-y-5 md:space-y-6',
  gridGap: 'gap-3 md:gap-4',
  radiusCard: 'rounded-2xl',
  radiusControl: 'rounded-lg',
  radiusPill: 'rounded-full',
} as const;

export const SURFACE = {
  // Cartao padrao
  card:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl',
  // Cartao com leve elevacao
  cardElevated:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm',
  // Cartao interativo (hover)
  cardInteractive:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-[0_10px_30px_-18px_rgba(13,148,136,0.45)]',
  // Fundo da area de trabalho
  canvas: 'bg-slate-50 dark:bg-slate-950',
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
  segment:
    'inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5',
  segmentItem:
    'px-3 py-1.5 text-xs font-medium rounded-md transition',
  segmentItemActive:
    'bg-teal-600 text-white shadow-sm',
  segmentItemIdle:
    'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
} as const;

// Helpers de formatacao
export const formatEUR = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-PT').format(value || 0);
