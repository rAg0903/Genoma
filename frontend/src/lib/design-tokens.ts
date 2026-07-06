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
  // Cartao padrao (elevado sobre o shell da pagina)
  card:
    'bg-white dark:bg-[#1f2a3d] border border-slate-200 dark:border-[#334155]/65 rounded-xl',
  // Cartao com leve elevacao
  cardElevated:
    'bg-white dark:bg-[#1f2a3d] border border-slate-200 dark:border-[#334155]/65 rounded-xl shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
  // Cartao interativo (hover)
  cardInteractive:
    'bg-white dark:bg-[#1f2a3d] border border-slate-200 dark:border-[#334155]/65 rounded-xl transition-all hover:border-teal-300 dark:hover:border-teal-600/50 hover:shadow-[0_10px_30px_-18px_rgba(13,148,136,0.45)]',
  // Fundo da area de trabalho
  canvas: 'bg-slate-50 dark:bg-[#0a1018]',
} as const;

/**
 * Hierarquia da app shell — espelha o light mode com tons distintos mas harmoniosos.
 * Light: sidebar branca · topbar slate-50 · canvas slate-100 · shell slate-50 · cards brancos.
 * Dark:  canvas #0a1018 · sidebar #131b29 · topbar #161f30 · shell #1a2336 · cards #1f2a3d.
 */
export const APP = {
  root: 'bg-slate-100 dark:bg-[#0a1018]',
  sidebar:
    'bg-white dark:bg-[#131b29] text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-[#243044]',
  sidebarSectionBorder: 'border-slate-200/80 dark:border-[#243044]',
  topbar:
    'bg-slate-50/95 dark:bg-[#161f30]/95 backdrop-blur border-b border-slate-200 dark:border-[#243044]',
  canvas: 'bg-slate-100/70 dark:bg-[#0a1018]',
} as const;

/** Contentor e corpo de pagina (alinhado com o Painel). */
export const PAGE = {
  shell:
    'flex flex-col min-h-full bg-slate-50 dark:bg-[#1a2336] border border-slate-200 dark:border-[#2d3a50] rounded-2xl overflow-hidden',
  body: `flex flex-col flex-1 ${LAYOUT.pagePadding} ${LAYOUT.sectionGap}`,
  title: 'text-slate-900 dark:text-slate-100 text-2xl font-semibold tracking-tight',
  subtitle: 'text-slate-500 dark:text-slate-400 text-[13px] mt-1',
} as const;

/** Ficha de contacto / processo — painel unico com subseccoes leves. */
export const DETAIL = {
  panel:
    'rounded-xl border border-slate-200/80 bg-white shadow-sm dark:bg-[#1f2a3d] dark:border-[#3d4f6a]/50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] overflow-hidden',
  section: 'px-5 py-3.5 sm:px-6 sm:py-4',
  sectionTitle:
    'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-600 dark:text-slate-200 mb-3',
  sectionIconBadge:
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/10 ring-1 ring-teal-500/15 dark:bg-teal-400/12 dark:ring-teal-400/25',
  sectionIcon: 'h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0',
  divider: 'border-t border-slate-200/80 dark:border-[#3d4f6a]/45',
  label: 'text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug',
  labelArea: 'min-h-[2.5rem] flex items-end',
  value: 'text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5',
  valueEmpty: 'text-slate-400 dark:text-slate-500 font-normal',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4',
  /** Cartao isolado (tabs com uma unica seccao). */
  card: 'rounded-xl border border-slate-200/80 bg-white shadow-sm dark:bg-[#1f2a3d] dark:border-[#3d4f6a]/50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] p-5 sm:p-6',
} as const;

/** Tabs deslizantes (cápsula escura em light; clara em dark — alinhado ao botão primário do login). */
export const TAB = {
  track: 'relative inline-flex gap-0.5 p-1 rounded-xl bg-slate-100/80 dark:bg-[#151f30]',
  indicator:
    'pointer-events-none absolute top-1 bottom-1 rounded-lg bg-[#0f172b] dark:bg-slate-100 shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  active: 'font-semibold text-white dark:text-slate-900',
  inactive: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
  activeIcon: 'text-white dark:text-slate-900',
  inactiveIcon: 'text-slate-400 dark:text-slate-500',
  activeCount: 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-800',
} as const;

/** Painéis de listagem / tabelas */
export const PANEL = {
  table:
    'bg-white dark:bg-[#1f2a3d] rounded-xl border border-slate-200 dark:border-[#334155]/65 overflow-hidden',
  tableHead: 'bg-slate-50 dark:bg-[#151f30] border-b border-slate-200 dark:border-[#334155]/55',
} as const;

/** Modais (Admin, Inventário, etc.) — alinhados com SURFACE/PANEL no dark mode. */
export const MODAL = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60',
  headerBorder: 'border-slate-200 dark:border-[#334155]/65',
  footer:
    'flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-[#334155]/65 bg-slate-50/50 dark:bg-[#151f30]/80 shrink-0',
  closeBtn:
    'p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#243044] transition-colors shrink-0',
} as const;

/** Drawer lateral (detalhe de processo, listagens, stocks). */
export const DRAWER = {
  shell:
    'bg-white dark:bg-[#1a2336] border-l border-slate-200 dark:border-[#2d3a50] shadow-2xl flex flex-col',
  header:
    'px-5 py-4 border-b border-slate-200/80 dark:border-[#2d3a50] bg-slate-50/90 dark:bg-[#161f30]/95 backdrop-blur-sm shrink-0',
  tabs: 'px-4 py-3 border-b border-slate-200/80 dark:border-[#2d3a50] bg-white dark:bg-[#1a2336] shrink-0',
  body: 'flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-slate-100/60 dark:bg-[#0f1520]/40',
  footer:
    'border-t border-slate-200/80 dark:border-[#2d3a50] px-5 py-3 bg-white/90 dark:bg-[#161f30]/90 shrink-0',
  panel:
    'rounded-xl border border-slate-200/80 bg-white shadow-sm dark:bg-[#1f2a3d] dark:border-[#3d4f6a]/50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] overflow-hidden',
  panelBody: 'px-4 py-3.5 sm:px-5 sm:py-4',
  sectionTitle:
    'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-600 dark:text-slate-300',
  sectionIcon:
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/10 ring-1 ring-teal-500/15 dark:bg-teal-400/12 dark:ring-teal-400/25',
  sectionIconGlyph: 'h-3.5 w-3.5 text-teal-600 dark:text-teal-400',
  fieldLabel: 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500',
  fieldValue: 'text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5',
  actionCard:
    'group w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-teal-300 hover:shadow-[0_8px_24px_-16px_rgba(13,148,136,0.45)] dark:border-[#3d4f6a]/50 dark:bg-[#1f2a3d] dark:hover:border-teal-600/50',
  statusBanner:
    'rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm dark:border-[#3d4f6a]/50 dark:bg-[#1f2a3d] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]',
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
  neutral: { iconBg: 'bg-slate-100 dark:bg-[#151f30]', icon: 'text-slate-600 dark:text-slate-300', ring: 'group-hover:border-slate-300 dark:group-hover:border-[#334155]' },
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
    'h-9 w-full px-3 text-sm rounded-lg border border-slate-200 dark:border-[#3d4f6a]/55 bg-white dark:bg-[#182338]/95 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm shadow-slate-900/[0.03] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-[border-color,box-shadow] duration-150 hover:border-slate-300 dark:hover:border-teal-600/35 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/70 disabled:opacity-60 disabled:cursor-not-allowed',
  select:
    'appearance-none bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E")] dark:[background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E")]',
  textarea:
    'min-h-[5.5rem] w-full px-3 py-2.5 text-sm leading-relaxed rounded-lg border border-slate-200 dark:border-[#3d4f6a]/55 bg-white dark:bg-[#182338]/95 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm shadow-slate-900/[0.03] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-[border-color,box-shadow] duration-150 hover:border-slate-300 dark:hover:border-teal-600/35 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/70 resize-y',
  numberInput:
    'tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0',
  buttonPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 transition disabled:opacity-50',
  buttonGhost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition',
  buttonSecondary:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#334155]/70 bg-white dark:bg-[#1f2a3d] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#243044] transition',
  searchInput:
    'w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#334155]/70 bg-white dark:bg-[#1f2a3d] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition',
  segment:
    'relative inline-flex gap-0.5 p-1 rounded-xl bg-slate-100/80 dark:bg-[#151f30]',
  segmentItem:
    'relative z-10 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200',
  segmentItemActive:
    'font-semibold text-white dark:text-slate-900',
  segmentIndicator:
    'pointer-events-none absolute top-1 bottom-1 rounded-lg bg-[#0f172b] dark:bg-slate-100 shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  segmentItemIdle:
    'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
} as const;

/** Campos de formulário (páginas e modais). */
export const FORM = {
  label: 'block text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug',
  /** Reserva altura para 2 linhas de label — mantém inputs alinhados na mesma linha. */
  labelArea: 'min-h-[2.5rem] flex items-end',
  /** Área do controlo abaixo do label (inputs, selects, date pickers). */
  fieldControl: 'mt-1.5 min-h-9',
  /** Controlo auxiliar (botão/checkbox) alinhado com inputs adjacentes. */
  fieldControlAlign: 'mt-1.5 min-h-9 flex items-center',
  hint: 'mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400',
  stack: 'space-y-4',
  alertInfo:
    'rounded-lg border border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/30 px-3 py-2 text-xs leading-relaxed text-sky-800 dark:text-sky-300',
  alertWarning:
    'rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300',
  checkboxRow:
    'flex items-start gap-2.5 text-[13px] font-medium leading-snug text-slate-700 dark:text-slate-200 cursor-pointer select-none [&_input[type=checkbox]]:mt-0.5',
  checkbox:
    'w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-teal-600 focus:ring-teal-500/40',
  /** Linha de campos com larguras fixas — não estica inputs. */
  fieldRow: 'flex flex-wrap items-start gap-x-4 gap-y-4',
  /** Larguras fixas por tipo de dado (enterprise forms). */
  fieldWidth: {
    xs: 'w-[6.5rem] max-w-full shrink-0',
    sm: 'w-[9.25rem] max-w-full shrink-0',
    md: 'w-[11.5rem] max-w-full shrink-0',
    lg: 'w-[14rem] max-w-full shrink-0',
    xl: 'w-[18rem] max-w-full shrink-0',
    '2xl': 'w-[22rem] max-w-full shrink-0',
    '3xl': 'w-[28rem] max-w-full shrink-0',
    full: 'w-full max-w-md',
  },
  /** @deprecated Preferir fieldRow + fieldWidth para formulários pro. */
  grid:
    'flex flex-wrap items-start gap-x-4 gap-y-4',
  tabContent: 'w-full min-w-0',
  /** Bloco de métricas agrupadas (ex.: semanas/dias de gestação). */
  metricGroup:
    'rounded-lg border border-slate-200/80 dark:border-[#334155]/55 bg-slate-50/60 dark:bg-[#151f30]/50 p-4',
  /** Nota informativa no rodapé de uma secção. */
  sectionNote:
    'mt-4 rounded-lg border border-slate-200/70 dark:border-teal-900/25 bg-slate-50/70 dark:bg-teal-950/15 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300',
  /** Campo só leitura / calculado. */
  readOnlyInput:
    'bg-slate-50 dark:bg-[#151f30]/60 text-slate-600 dark:text-slate-400 cursor-default focus:ring-0',
  /** Input desactivado. */
  disabledInput:
    'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-[#151f30]/40',
  /** Dropdown Radix alinhado ao CRM. */
  selectContent:
    'z-[100] overflow-hidden rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1f2a3d] text-slate-900 dark:text-slate-200 shadow-lg',
  selectItem:
    'rounded-md py-2 pl-2.5 pr-8 text-sm cursor-pointer outline-none focus:bg-teal-50 dark:focus:bg-teal-900/25 data-[highlighted]:bg-teal-50 dark:data-[highlighted]:bg-teal-900/25',
} as const;

// Helpers de formatacao
export const formatEUR = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-PT').format(value || 0);

export type FormFieldWidth = keyof typeof FORM.fieldWidth;
