import { AlertTriangle, Bell, ChevronRight } from 'lucide-react';
import { ALERT_STYLES, AlertLevel, SURFACE } from '../../../lib/design-tokens';

export interface DashboardAlertDetalhe {
  lote: string;
  teste?: string;
  quantidade: number;
}

export interface DashboardAlert {
  id: string;
  nivel: AlertLevel;
  titulo: string;
  descricao?: string;
  total?: number;
  detalhes?: DashboardAlertDetalhe[];
  onClick?: () => void;
}

const NIVEL_LABEL: Record<AlertLevel, string> = {
  critico: 'Critico',
  aviso: 'Aviso',
  info: 'Info',
  sucesso: 'OK',
};

/**
 * Painel de alertas operacionais. Ordena por severidade e usa a semantica
 * de cor do design system. Cada alerta pode navegar para a area relevante.
 */
export function AlertPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const ordem: AlertLevel[] = ['critico', 'aviso', 'info', 'sucesso'];
  const ordered = [...alerts].sort((a, b) => ordem.indexOf(a.nivel) - ordem.indexOf(b.nivel));

  return (
    <section className={`${SURFACE.cardElevated} overflow-hidden`}>
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold">Alertas criticos</h3>
        </div>
        {ordered.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
            {ordered.filter((a) => a.nivel === 'critico').length} criticos
          </span>
        )}
      </header>

      {ordered.length === 0 ? (
        <div className="px-3.5 py-6 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1.5">
            <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sem alertas. Tudo operacional.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {ordered.map((a) => {
            const s = ALERT_STYLES[a.nivel];
            return (
              <li key={a.id}>
                <button
                  onClick={a.onClick}
                  disabled={!a.onClick}
                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors disabled:cursor-default"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
                        {a.titulo}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${s.label}`}>
                        {NIVEL_LABEL[a.nivel]}
                      </span>
                    </div>
                    {a.descricao && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{a.descricao}</p>
                    )}
                    {a.detalhes && a.detalhes.length > 0 && (
                      <ul className="mt-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                        {a.detalhes.map((d) => (
                          <li key={`${a.id}-${d.lote}`} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="min-w-0 text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{d.lote}</span>
                              {d.teste && <span className="text-slate-400 dark:text-slate-500"> · {d.teste}</span>}
                            </span>
                            <span className="font-bold tabular-nums text-slate-600 dark:text-slate-300 flex-shrink-0">
                              {d.quantidade}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {a.detalhes && a.detalhes.length === 0 && typeof a.total === 'number' && a.total === 0 && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sem kits disponiveis por lote</p>
                    )}
                  </div>
                  {typeof a.total === 'number' && (
                    <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${s.label}`}>{a.total}</span>
                  )}
                  {a.onClick && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
