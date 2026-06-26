import { FolderOpen, CalendarClock, FlaskConical, BadgeCheck, Wallet, AlertTriangle, Send } from 'lucide-react';
import { Processo } from '../../data/types';
import { KpiCard } from '../dashboard/KpiCard';
import { formatNumber, LAYOUT } from '../../../lib/design-tokens';
import {
  isAtivo, isAtrasado, isResultadoPorValidar, isRelatorioPorEnviar, isFaturaPorEmitir, tatDias,
} from '../../../lib/processos';

export type ProcessKpiId =
  | 'ativos' | 'colheitas_hoje' | 'por_validar' | 'a_faturar' | 'relatorios' | 'atrasados' | 'tat';

interface ProcessKpisProps {
  processos: Processo[];
  activeKpi: ProcessKpiId | null;
  onSelect: (id: ProcessKpiId) => void;
}

const isHoje = (d?: string) => {
  if (!d) return false;
  const t = new Date(d);
  const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
};

export function ProcessKpis({ processos, activeKpi, onSelect }: ProcessKpisProps) {
  const ativos = processos.filter(isAtivo).length;
  const colheitasHoje = processos.filter((p) => isHoje(p.data_colheita)).length;
  const porValidar = processos.filter(isResultadoPorValidar).length;
  const aFaturar = processos.filter(isFaturaPorEmitir).length;
  const relatorios = processos.filter(isRelatorioPorEnviar).length;
  const atrasados = processos.filter((p) => isAtrasado(p)).length;

  const tats = processos.map(tatDias).filter((v): v is number => v !== null);
  const tatMedio = tats.length ? Math.round(tats.reduce((a, b) => a + b, 0) / tats.length) : 0;

  const cards = [
    { id: 'ativos' as const, label: 'Processos ativos', value: formatNumber(ativos), icon: FolderOpen, tone: 'brand' as const, hint: `${processos.length} total` },
    { id: 'colheitas_hoje' as const, label: 'Colheitas do dia', value: formatNumber(colheitasHoje), icon: CalendarClock, tone: 'info' as const },
    { id: 'por_validar' as const, label: 'A validar', value: formatNumber(porValidar), icon: FlaskConical, tone: 'violet' as const },
    { id: 'a_faturar' as const, label: 'A faturar', value: formatNumber(aFaturar), icon: Wallet, tone: 'success' as const },
    { id: 'relatorios' as const, label: 'Relatorios por enviar', value: formatNumber(relatorios), icon: Send, tone: 'neutral' as const },
    { id: 'atrasados' as const, label: 'Atrasados (>7d)', value: formatNumber(atrasados), icon: AlertTriangle, tone: atrasados > 0 ? 'danger' as const : 'neutral' as const },
    { id: 'tat' as const, label: 'TAT medio (dias)', value: formatNumber(tatMedio), icon: BadgeCheck, tone: 'info' as const, hint: 'Colheita -> resultado' },
  ];

  return (
    <div className={LAYOUT.kpiGrid}>
      {cards.map((c) => (
        <div key={c.id} className={`min-w-0 h-full ${activeKpi === c.id ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
          <KpiCard
            label={c.label}
            value={c.value}
            icon={c.icon}
            tone={c.tone}
            hint={c.hint}
            onClick={c.id === 'tat' ? undefined : () => onSelect(c.id)}
          />
        </div>
      ))}
    </div>
  );
}
