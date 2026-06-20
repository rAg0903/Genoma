import { Calendar, Users } from 'lucide-react';
import { Contact } from '../../data/types';
import {
  CONTACTO_PAGE_ESTADOS, CONTACTO_PIPELINE_COLORS, CONTACTO_PIPELINE_LABEL, getContactoPipelineEstado,
} from '../../../lib/contactos';
import { formatCalendarDatePt } from '../../../lib/dates';
import { EmptyState } from '../shared/EmptyState';

interface ContactPipelineProps {
  contacts: Contact[];
  onOpen: (c: Contact) => void;
  onEdit: (c: Contact) => void;
}

export function ContactPipeline({ contacts, onOpen, onEdit }: ContactPipelineProps) {
  const comEstado = contacts.filter((c) => getContactoPipelineEstado(c) !== null);

  if (comEstado.length === 0 && contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={Users} title="Sem contactos" description="Nao ha contactos que correspondam aos filtros atuais." />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CONTACTO_PAGE_ESTADOS.map((estado) => {
        const items = contacts.filter((c) => getContactoPipelineEstado(c) === estado);
        const color = CONTACTO_PIPELINE_COLORS[estado];
        return (
          <div key={estado} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {CONTACTO_PIPELINE_LABEL[estado]}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 tabular-nums">{items.length}</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpen(c)}
                  onDoubleClick={() => onEdit(c)}
                  className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition"
                >
                  <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{c.nome}</div>
                  {c.data_colheita_prevista && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      Colheita: {formatCalendarDatePt(c.data_colheita_prevista)}
                    </div>
                  )}
                  {c.nif && <div className="text-[11px] text-slate-400 font-mono mt-1">NIF {c.nif}</div>}
                </button>
              ))}
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
