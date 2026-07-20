import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { Kit, Lote } from '../../data/types';
import { ChartCard } from '../dashboard/ChartCard';
import { KIT_STATUS_CHART_COLOR, normalize } from '../../../lib/stocks';

export function StockCharts({ kits, lotes }: { kits: Kit[]; lotes: Lote[] }) {
  const byStatus = Object.entries(
    kits.reduce<Record<string, number>>((acc, k) => {
      const s = normalize(k.status);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {}),
  ).map(([status, total]) => ({ status, total, color: KIT_STATUS_CHART_COLOR[status] ?? '#94a3b8' }));

  const consumo = [...lotes]
    .map((l) => ({ lote: l.codigo, consumido: Math.max(0, l.quantidade_total - l.quantidade_disponivel), total: l.quantidade_total }))
    .filter((l) => l.total > 0)
    .sort((a, b) => b.consumido - a.consumido)
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Distribuicao de kits" subtitle="Por estado" icon={PieIcon}>
        {byStatus.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-slate-400">Sem dados</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="total" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {byStatus.map((e) => <Cell key={e.status} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {byStatus.map((e) => (
            <span key={e.status} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} /> {e.status} ({e.total})
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Consumo por lote" subtitle="Top 6 lotes" icon={BarChart3}>
        {consumo.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-slate-400">Sem dados</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="lote" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} tickMargin={6} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="consumido" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
