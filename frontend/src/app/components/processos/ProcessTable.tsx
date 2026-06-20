import { Eye, Edit, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Processo } from '../../data/types';
import { StatusBadge } from '../shared/StatusBadge';
import { PROCESS_STATUS_STYLES } from '../../../lib/design-system';
import { diasDesde, ultimaAtualizacao, isAtrasado } from '../../../lib/processos';
import { formatCalendarDatePt } from '../../../lib/dates';

interface ProcessTableProps {
  processos: Processo[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (p: Processo) => void;
  onEdit: (p: Processo) => void;
  onDelete: (p: Processo) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const fmt = (d?: string | null) => formatCalendarDatePt(d);

function SlaCell({ p }: { p: Processo }) {
  const dias = diasDesde(ultimaAtualizacao(p));
  const atrasado = isAtrasado(p);
  if (dias === null) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${atrasado ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
      {atrasado ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {dias}d
    </span>
  );
}

export function ProcessTable({
  processos, selectedIds, onToggle, onToggleAll, onOpen, onEdit, onDelete, canUpdate, canDelete,
}: ProcessTableProps) {
  const allSelected = processos.length > 0 && processos.every((p) => selectedIds.has(p.id));

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="accent-teal-600 w-4 h-4" />
              </th>
              <th className="px-3 py-3">Nº Processo</th>
              <th className="px-3 py-3">Paciente</th>
              <th className="px-3 py-3">Medico</th>
              <th className="px-3 py-3">Teste</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">SLA</th>
              <th className="px-3 py-3">Relatorio</th>
              <th className="px-3 py-3">Faturacao</th>
              <th className="px-3 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {processos.map((p) => {
              const pendente = !!p.fatura_emitida && !p.pagamento_data;
              const paga = !!p.pagamento_data;
              return (
                <tr
                  key={p.id}
                  className={`group cursor-pointer transition-colors ${selectedIds.has(p.id) ? 'bg-teal-50/50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  onClick={() => onOpen(p)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onToggle(p.id)} className="accent-teal-600 w-4 h-4" />
                  </td>
                  <td className="px-3 py-3 text-[13px] font-semibold font-mono text-slate-900 dark:text-slate-100">{p.numero}</td>
                  <td className="px-3 py-3 text-[13px] text-slate-700 dark:text-slate-300">{p.paciente_nome}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{p.medico}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{p.teste}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.estado} map={PROCESS_STATUS_STYLES} className="px-2 py-0.5" /></td>
                  <td className="px-3 py-3"><SlaCell p={p} /></td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${p.data_envio_relatorio ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : p.relatorio_validado ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {p.data_envio_relatorio ? 'Enviado' : p.relatorio_validado ? 'Validado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${paga ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : pendente ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {paga ? 'Paga' : pendente ? 'Pendente' : 'Sem fatura'}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onOpen(p)} className="p-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                      {canUpdate && <button onClick={() => onEdit(p)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition"><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button onClick={() => onDelete(p)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {processos.map((p) => (
          <div key={p.id} className="p-4" onClick={() => onOpen(p)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <input type="checkbox" checked={selectedIds.has(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(p.id)} className="accent-teal-600 w-4 h-4 mt-1" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">{p.numero}</span>
                    <StatusBadge status={p.estado} map={PROCESS_STATUS_STYLES} className="px-2 py-0.5" />
                  </div>
                  <div className="text-[13px] text-slate-700 dark:text-slate-300 mt-1">{p.paciente_nome}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.medico} · {p.teste}</div>
                  <div className="mt-1"><SlaCell p={p} /></div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 flex-shrink-0">{fmt(p.data_entrada)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
