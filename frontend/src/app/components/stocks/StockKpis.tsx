import { Package, Boxes, CalendarClock, AlertOctagon } from 'lucide-react';
import { Kit, Lote } from '../../data/types';
import { KpiCard } from '../dashboard/KpiCard';
import { computeStockKpis } from '../../../lib/stocks';
import { formatNumber, LAYOUT } from '../../../lib/design-tokens';

export type StockKpiId = 'disponiveis' | 'lotes' | 'expirar' | 'expirados';

interface Props {
  kits: Kit[];
  lotes: Lote[];
  onSelect?: (id: StockKpiId) => void;
  activeKpi?: StockKpiId | null;
}

export function StockKpis({ kits, lotes, onSelect, activeKpi }: Props) {
  const k = computeStockKpis(kits, lotes, []);

  const cards = [
    { id: 'disponiveis' as const, label: 'Kits disponiveis', value: formatNumber(k.disponiveis), icon: Package, tone: 'brand' as const },
    { id: 'lotes' as const, label: 'Lotes ativos', value: formatNumber(k.lotesAtivos), icon: Boxes, tone: 'violet' as const },
    { id: 'expirar' as const, label: 'Lotes a expirar', value: formatNumber(k.lotesAExpirar), icon: CalendarClock, tone: k.lotesAExpirar > 0 ? 'warning' as const : 'neutral' as const },
    { id: 'expirados' as const, label: 'Kits expirados', value: formatNumber(k.kitsExpirados), icon: AlertOctagon, tone: k.kitsExpirados > 0 ? 'danger' as const : 'neutral' as const },
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
            hint={'hint' in c ? c.hint : undefined}
            onClick={!onSelect ? undefined : () => onSelect(c.id as StockKpiId)}
          />
        </div>
      ))}
    </div>
  );
}
