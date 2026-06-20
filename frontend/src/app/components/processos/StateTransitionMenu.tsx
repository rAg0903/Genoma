import { useState } from 'react';
import { ChevronDown, ArrowRight, Ban } from 'lucide-react';
import { EstadoProcesso, proximosEstados, ACAO_LABEL, ESTADO_LABEL } from '../../../lib/processos';

interface StateTransitionMenuProps {
  estado: EstadoProcesso;
  onTransition: (destino: EstadoProcesso) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Menu que oferece APENAS as transicoes validas a partir do estado atual,
 * alinhado com a maquina de estados do backend.
 */
export function StateTransitionMenu({ estado, onTransition, disabled, size = 'md' }: StateTransitionMenuProps) {
  const [open, setOpen] = useState(false);
  const destinos = proximosEstados(estado);

  if (destinos.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Ban className="w-3.5 h-3.5" /> Estado final
      </span>
    );
  }

  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 ${pad} font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition disabled:opacity-50`}
      >
        Avancar
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 mt-1 z-50 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
            {destinos.map((d) => (
              <button
                key={d}
                onClick={(e) => { e.stopPropagation(); setOpen(false); onTransition(d); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  d === 'Cancelado' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {d === 'Cancelado' ? <Ban className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 text-teal-500" />}
                {ACAO_LABEL[d] ?? ESTADO_LABEL[d]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
