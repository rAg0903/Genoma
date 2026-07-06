import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FlaskConical, Loader2, Plus, X } from 'lucide-react';
import { Processo } from '../../data/types';
import {
  processosApi, ResultadoProcesso, AnomaliaGenetica,
} from '../../../lib/api-processos';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { CONTROL } from '../../../lib/design-tokens';
import { formatCalendarDatePt } from '../../../lib/dates';
import {
  DrawerField,
  DrawerFieldGrid,
  DrawerLoading,
  DrawerPanel,
  DrawerPanelContent,
  DrawerPanelHeader,
  DrawerTabBody,
} from '../shared/DrawerTabLayout';

const fmt = (d?: string | null) => formatCalendarDatePt(d);

export function ProcessResultadoTab({
  processo, canUpdate, onChanged, variant = 'page',
}: {
  processo: Processo;
  canUpdate: boolean;
  onChanged?: () => void;
  variant?: 'page' | 'drawer';
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

  if (loading) {
    return variant === 'drawer' ? <DrawerLoading label="A carregar resultados…" /> : (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar resultados…
      </div>
    );
  }

  const podeRegistar = canUpdate && (processo.estado === 'Em Analise' || processo.estado === 'Resultado Disponivel');
  const podeValidar = canUpdate && processo.estado === 'Resultado Disponivel';

  const content = (
    <>
      <DrawerPanel className={variant === 'page' ? 'border-gray-200 dark:border-gray-700' : ''}>
        <DrawerPanelHeader
          title="Análise laboratorial"
          icon={FlaskConical}
          subtitle='Modelo «tudo OK por defeito» — assinale apenas anomalias'
        />
        <DrawerPanelContent className="space-y-4">
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-[#3d4f6a]/50 dark:bg-[#151f30]/50">
            <input type="checkbox" checked={tudoOk} onChange={(e) => setTudoOk(e.target.checked)} disabled={!podeRegistar} className={CHECKBOX_INPUT_CLASS} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tudo OK</span>
          </label>

          {!tudoOk && (
            <div className="space-y-2">
              {anomalias.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    value={a.cromossoma}
                    onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, cromossoma: e.target.value } : x))}
                    placeholder="Cromossoma"
                    disabled={!podeRegistar}
                    className={`${CONTROL.input} w-24`}
                  />
                  <input
                    value={a.resultado_valor ?? ''}
                    onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, resultado_valor: e.target.value } : x))}
                    placeholder="Resultado"
                    disabled={!podeRegistar}
                    className={`${CONTROL.input} min-w-0 flex-1`}
                  />
                  <input
                    value={a.probabilidade ?? ''}
                    onChange={(e) => setAnomalias((prev) => prev.map((x, j) => j === i ? { ...x, probabilidade: e.target.value } : x))}
                    placeholder="Prob."
                    disabled={!podeRegistar}
                    className={`${CONTROL.input} w-20`}
                  />
                  <button type="button" onClick={() => setAnomalias((prev) => prev.filter((_, j) => j !== i))} disabled={!podeRegistar} className={`${CONTROL.buttonGhost} p-1.5 text-rose-500`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAnomalias((prev) => [...prev, { cromossoma: '', resultado_valor: 'Detectado', tipo_resultado: 'Cromossoma' }])}
                disabled={!podeRegistar}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                <Plus className="h-4 w-4" /> Adicionar anomalia
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-[#3d4f6a]/40">
            <button type="button" onClick={registar} disabled={!podeRegistar || busy} className={CONTROL.buttonPrimary}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Registar resultado
            </button>
            <button type="button" onClick={validar} disabled={!podeValidar || busy} className={`${CONTROL.buttonSecondary} border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20`}>
              <CheckCircle2 className="h-4 w-4" /> Validar
            </button>
          </div>
        </DrawerPanelContent>
      </DrawerPanel>

      {data && (
        <DrawerPanel>
          <DrawerPanelHeader title="Datas de registo" icon={CheckCircle2} />
          <DrawerPanelContent>
            <DrawerFieldGrid>
              <DrawerField label="Data do resultado" value={fmt(data.data_resultado)} />
              <DrawerField label="Data de validação" value={fmt(data.data_validacao)} />
            </DrawerFieldGrid>
          </DrawerPanelContent>
        </DrawerPanel>
      )}
    </>
  );

  if (variant === 'drawer') {
    return <DrawerTabBody>{content}</DrawerTabBody>;
  }

  return <div className="space-y-5">{content}</div>;
}
