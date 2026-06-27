import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FlaskConical, Loader2, Plus, X } from 'lucide-react';
import { Processo } from '../../data/types';
import {
  processosApi, ResultadoProcesso, AnomaliaGenetica,
} from '../../../lib/api-processos';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { formatCalendarDatePt } from '../../../lib/dates';

const fmt = (d?: string | null) => formatCalendarDatePt(d);

function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-8 justify-center" style={{ fontSize: '13px' }}>
      <Loader2 className="w-4 h-4 animate-spin" /> A carregar resultados…
    </div>
  );
}

export function ProcessResultadoTab({
  processo, canUpdate, onChanged,
}: {
  processo: Processo;
  canUpdate: boolean;
  onChanged?: () => void;
}) {
  const [data, setData] = useState<ResultadoProcesso | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tudoOk, setTudoOk] = useState(true);
  const [anomalias, setAnomalias] = useState<AnomaliaGenetica[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await processosApi.getResultados(processo.id);
      setData(r);
      setTudoOk(r.resultado_tudo_ok);
      setAnomalias(r.anomalias.length ? r.anomalias : []);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [processo.id]);

  useEffect(() => { void load(); }, [load]);

  const registar = async () => {
    setBusy(true);
    try {
      await processosApi.registarResultados(processo.id, {
        tudo_ok: tudoOk,
        anomalias: tudoOk ? [] : anomalias.filter((a) => a.cromossoma.trim()),
      });
      toast.success('Resultado registado.');
      onChanged?.();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao registar resultado.');
    } finally {
      setBusy(false);
    }
  };

  const validar = async () => {
    setBusy(true);
    try {
      await processosApi.validar(processo.id);
      toast.success('Resultado validado.');
      onChanged?.();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao validar.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState />;

  const podeRegistar = canUpdate && (processo.estado === 'Em Analise' || processo.estado === 'Resultado Disponivel');
  const podeValidar = canUpdate && processo.estado === 'Resultado Disponivel';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Modelo &quot;tudo OK por defeito&quot;</div>
            <p className="text-xs text-gray-400 mt-0.5">Assinale apenas as anomalias detetadas.</p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={tudoOk} onChange={(e) => setTudoOk(e.target.checked)} disabled={!podeRegistar} className={CHECKBOX_INPUT_CLASS} />
            <span className="text-sm text-gray-700 dark:text-gray-200">Tudo OK</span>
          </label>
        </div>

        {!tudoOk && (
          <div className="mt-4 space-y-2">
            {anomalias.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={a.cromossoma}
                  onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, cromossoma: e.target.value } : x))}
                  placeholder="Cromossoma (ex: 21)"
                  disabled={!podeRegistar}
                  className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  value={a.resultado_valor ?? ''}
                  onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, resultado_valor: e.target.value } : x))}
                  placeholder="Resultado (ex: Trissomia)"
                  disabled={!podeRegistar}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  value={a.probabilidade ?? ''}
                  onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, probabilidade: e.target.value } : x))}
                  placeholder="Prob."
                  disabled={!podeRegistar}
                  className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <button type="button" onClick={() => setAnomalias((prev) => prev.filter((_, j) => j !== i))} disabled={!podeRegistar} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAnomalias((prev) => [...prev, { cromossoma: '', resultado_valor: 'Detectado', tipo_resultado: 'Cromossoma' }])}
              disabled={!podeRegistar}
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Adicionar anomalia
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={registar} disabled={!podeRegistar || busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} Registar resultado
        </button>
        <button type="button" onClick={validar} disabled={!podeValidar || busy} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40">
          <CheckCircle2 className="w-4 h-4" /> Validar
        </button>
      </div>

      {data && (
        <div className="text-xs text-gray-400 space-y-1">
          <div>Data do resultado: {fmt(data.data_resultado)}</div>
          <div>Data de validação: {fmt(data.data_validacao)}</div>
        </div>
      )}
    </div>
  );
}
