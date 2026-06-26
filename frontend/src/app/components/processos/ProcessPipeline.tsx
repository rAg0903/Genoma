import { Clock, AlertTriangle, FolderOpen } from 'lucide-react';
import { Processo } from '../../data/types';
import {
  getVisiblePipelineColumns,
  EstadoProcesso,
  diasDesde,
  ultimaAtualizacao,
  isAtrasado,
} from '../../../lib/processos';
import { PROCESS_STATE_COLORS } from '../../../lib/design-tokens';
import { StateTransitionMenu } from './StateTransitionMenu';
import { EmptyState } from '../shared/EmptyState';

interface ProcessPipelineProps {
  processos: Processo[];
  onOpen: (p: Processo) => void;
  onTransition: (p: Processo, destino: EstadoProcesso) => void;
  canUpdate: boolean;
  /** Chave do chip de estado activo — limita o kanban à coluna correspondente. */
  columnFilter?: string;
}

const COLUMN_COLORS: Record<string, string> = {
  'Colheita Realizada': PROCESS_STATE_COLORS['Colheita Realizada'],
  lab_analise: '#6366f1',
  'Resultado Disponivel': PROCESS_STATE_COLORS['Resultado Disponivel'],
  Validado: PROCESS_STATE_COLORS.Validado,
  Faturado: PROCESS_STATE_COLORS.Faturado,
  Cancelado: PROCESS_STATE_COLORS.Cancelado,
};

/**
 * Quadro tipo kanban por estado. Cada coluna mostra os processos nesse estado;
 * cada cartao permite avancar apenas para transicoes validas.
 */
export function ProcessPipeline({ processos, onOpen, onTransition, canUpdate, columnFilter }: ProcessPipelineProps) {
  const columns = getVisiblePipelineColumns(columnFilter);
  const singleColumn = columns.length === 1;

  if (processos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={FolderOpen} title="Sem processos" description="Nao ha processos que correspondam aos filtros atuais." />
      </div>
    );
  }

  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 ${singleColumn ? 'max-w-xl' : ''}`}>
      {columns.map((column) => {
        const items = processos.filter((p) => column.estados.includes(p.estado));
        const color = COLUMN_COLORS[column.key] ?? '#94a3b8';
        return (
          <div key={column.key} className={`flex-shrink-0 ${singleColumn ? 'w-full' : 'w-72'}`}>
            <div className="flex items-center justify-between mb-2 px-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-tight">{column.label}</span>
              </div>
              <span className="text-xs font-bold text-slate-400 tabular-nums flex-shrink-0">{items.length}</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((p) => {
                const dias = diasDesde(ultimaAtualizacao(p));
                const atrasado = isAtrasado(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition group"
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(p)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-mono">{p.numero}</span>
                        {atrasado && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{p.paciente_nome}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.teste}</div>
                    </button>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] ${atrasado ? 'text-rose-500' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3" />
                        {dias !== null ? `${dias}d` : '—'}
                      </span>
                      {canUpdate && (
                        <StateTransitionMenu estado={p.estado} onTransition={(d) => onTransition(p, d)} size="sm" />
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-6 text-center text-[11px] text-slate-300 dark:text-slate-600">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
