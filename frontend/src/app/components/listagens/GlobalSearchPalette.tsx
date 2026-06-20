import { useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Loader2, Activity, FlaskConical, Users, Stethoscope, Package, Boxes } from 'lucide-react';
import { listagensApi, SearchGroup, SearchResultItem } from '../../../lib/api-listagens';

const TIPO_ICON: Record<string, typeof Activity> = {
  processo: Activity,
  resultado: FlaskConical,
  paciente: Users,
  medico: Stethoscope,
  kit: Package,
  lote: Boxes,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: SearchResultItem['target']) => void;
}

/**
 * Pesquisa global instantanea (command palette) sobre processos, resultados,
 * pacientes, medicos, kits e lotes. Abre com Ctrl/Cmd+K.
 */
export function GlobalSearchPalette({ open, onClose, onNavigate }: Props) {
  const [value, setValue] = useState('');
  const [grupos, setGrupos] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) { setValue(''); setGrupos([]); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    if (q.length < 2) { setGrupos([]); setLoading(false); return; }
    setLoading(true);
    const current = ++reqId.current;
    const handle = setTimeout(async () => {
      try {
        const res = await listagensApi.search(q);
        if (current === reqId.current) setGrupos(res);
      } catch {
        if (current === reqId.current) setGrupos([]);
      } finally {
        if (current === reqId.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [value, open]);

  if (!open) return null;

  const total = grupos.reduce((n, g) => n + g.itens.length, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <Command
        shouldFilter={false}
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 border-b border-slate-100 dark:border-slate-800">
          {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
          <Command.Input
            autoFocus
            value={value}
            onValueChange={setValue}
            placeholder="Pesquisar paciente, médico, processo, kit, lote..."
            className="flex-1 py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">ESC</kbd>
        </div>

        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          {value.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">Escreva pelo menos 2 caracteres para pesquisar.</p>
          ) : !loading && total === 0 ? (
            <Command.Empty className="px-3 py-8 text-center text-sm text-slate-400">Sem resultados para “{value}”.</Command.Empty>
          ) : (
            grupos.map((grupo) => {
              const Icon = TIPO_ICON[grupo.tipo] || Activity;
              return (
                <Command.Group
                  key={grupo.tipo}
                  heading={grupo.label}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400"
                >
                  {grupo.itens.map((item) => (
                    <Command.Item
                      key={`${grupo.tipo}-${item.id}`}
                      value={`${grupo.tipo}-${item.id}-${item.label}`}
                      onSelect={() => onNavigate(item.target)}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-teal-50 dark:data-[selected=true]:bg-teal-900/20 transition"
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-800 dark:text-slate-100 truncate">{item.label}</span>
                        {item.sublabel && <span className="block text-xs text-slate-400 truncate">{item.sublabel}</span>}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })
          )}
        </Command.List>
      </Command>
    </div>
  );
}
