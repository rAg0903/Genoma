import { CONTROL, FORM } from './design-tokens';

export const ADD_ACTION_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 transition-colors';

/** @deprecated Preferir CONTROL.input ou MODAL_INPUT_CLASS */
export const FORM_INPUT_CLASS = CONTROL.input;

export const FORM_LABEL_CLASS = FORM.label;

export const KIT_STATUS_STYLES: Record<string, string> = {
  Disponível: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Reservado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Em trânsito': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Utilizado: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  'Inválido': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Perdido: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Expirado: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const PROCESS_STATUS_STYLES: Record<string, string> = {
  Agendado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Kit Reservado': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Colheita Realizada': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Enviado Laboratorio': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Em Analise': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Resultado Disponivel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Validado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Faturado: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  Cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
