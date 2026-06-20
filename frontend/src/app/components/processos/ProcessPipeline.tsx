import { Clock, AlertTriangle } from 'lucide-react';
import { Processo } from '../../data/types';
import { PROCESS_PIPELINE_ESTADOS, EstadoProcesso, diasDesde, ultimaAtualizacao, isAtrasado } from '../../../lib/processos';
import { PROCESS_STATE_COLORS } from '../../../lib/design-tokens';
import { StateTransitionMenu } from './StateTransitionMenu';
import { EmptyState } from '../shared/EmptyState';
import { FolderOpen } from 'lucide-react';

interface ProcessPipelineProps {
  processos: Processo[];
  onOpen: (p: Processo) => void;
  onTransition: (p: Processo, destino: EstadoProcesso) => void;
  canUpdate: boolean;
}

/**
 * Quadro tipo kanban por estado. Cada coluna mostra os processos nesse estado;
 * cada cartao permite avancar apenas para transicoes validas.
 */
export function ProcessPipeline({ processos, onOpen, onTransition, canUpdate }: ProcessPipelineProps) {
  if (processos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={FolderOpen} title="Sem processos" description="Nao ha processos que correspondam aos filtros atuais." />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {PROCESS_PIPELINE_ESTADOS.map((estado) => {
        const items = processos.filter((p) => p.estado === estado);
        const color = PROCESS_STATE_COLORS[estado] ?? '#94a3b8';
        return (
          <div key={estado} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{estado}</span>
              </div>
              <span className="text-xs font-bold text-slate-400 tabular-nums">{items.length}</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((p) => {
                const dias = diasDesde(ultimaAtualizacao(p));
                const atrasado = isAtrasado(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p)}
                    className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 font-mono">{p.numero}</span>
                      {atrasado && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{p.paciente_nome}</div>
                    <div className="text-[11px] text-slate-400 truncate">{p.teste}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] ${atrasado ? 'text-rose-500' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3" />
                        {dias !== null ? `${dias}d` : '—'}
                      </span>
                      {canUpdate && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <StateTransitionMenu estado={p.estado} onTransition={(d) => onTransition(p, d)} size="sm" />
                        </span>
                      )}
                    </div>
                  </button>
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
