import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FlaskConical, Loader2 } from 'lucide-react';
import { Processo } from '../../data/types';
import { processosApi } from '../../../lib/api-processos';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { CONTROL, DRAWER } from '../../../lib/design-tokens';
import { formatCalendarDatePt } from '../../../lib/dates';
import {
  cromossomasAnalisados,
  derivarSemAnomalias,
  inicializarNegativo,
  Negativo,
  normalizarResultado,
  NUMEROS,
  RESULTADOS_CROMOSSOMA,
  RESULTADOS_SEXUAIS,
  ResultadosMap,
  temPositivoOuSuspeita,
} from '../../../lib/cromossoma-opcoes';
import { MinDatePicker } from '../shared/MinDatePicker';
import { FormRadixSelect } from '../shared/FormPageChrome';
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

const cardClass = (valor: string) => {
  if (temPositivoOuSuspeita(valor)) {
    return 'border-amber-500/55 bg-amber-500/[0.08] ring-1 ring-amber-500/25';
  }
  return 'border-slate-200/90 bg-white/50 dark:border-[#3d4f6a]/55 dark:bg-[#151f30]/55';
};

const CROMOSSOMA_SELECT_OPTIONS = RESULTADOS_CROMOSSOMA.map((r) => ({ value: r, label: r }));

const classeCelulaMapa = (analisado: boolean, valor?: string) => {
  if (!analisado) return 'border-slate-600/50 bg-slate-800/40 text-slate-500';
  if (temPositivoOuSuspeita(valor || '')) return 'border-amber-500/70 bg-amber-500/20 text-amber-200';
  return 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300';
};

const kitLabel = (processo: Processo) =>
  processo.sub_teste_nome || processo.teste_pai_nome || processo.teste || 'Kit';

export function ProcessResultadoTab({
  processo, canUpdate, onChanged, variant = 'page',
}: {
  processo: Processo;
  canUpdate: boolean;
  onChanged?: () => void;
  variant?: 'page' | 'drawer';
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [analisados, setAnalisados] = useState<number[]>(() => cromossomasAnalisados({
    sub_teste_nome: processo.sub_teste_nome,
    teste_pai_nome: processo.teste_pai_nome,
    teste: processo.teste,
  }));

  const [resultados, setResultados] = useState<ResultadosMap>(() => inicializarNegativo(analisados));
  const [semAnomalias, setSemAnomalias] = useState(true);
  const [sugerirRepeticao, setSugerirRepeticao] = useState(false);
  const [fracaoFetal, setFracaoFetal] = useState('');
  const [cromossomasSexuais, setCromossomasSexuais] = useState('');
  const [resultadoSexuais, setResultadoSexuais] = useState('');
  const [idAmostra, setIdAmostra] = useState('');
  const [dataEnvioLab, setDataEnvioLab] = useState('');
  const [dataRecepcaoLab, setDataRecepcaoLab] = useState('');
  const [dataRelatorioLab, setDataRelatorioLab] = useState('');
  const [dataResultado, setDataResultado] = useState<string | null>(null);
  const [dataValidacao, setDataValidacao] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await processosApi.getResultados(processo.id);
      const cromossomas = r.cromossomas_analisados?.length
        ? r.cromossomas_analisados
        : cromossomasAnalisados({
          teste_cromossomas: r.teste_cromossomas,
          sub_teste_nome: processo.sub_teste_nome,
          teste_pai_nome: processo.teste_pai_nome,
          teste: processo.teste,
        });

      setAnalisados(cromossomas);

      const map = { ...inicializarNegativo(cromossomas) };
      for (const [key, value] of Object.entries(r.resultados_cromossomas || {})) {
        const n = parseInt(key, 10);
        if (cromossomas.includes(n)) map[n] = normalizarResultado(value);
      }

      setResultados(map);
      setSemAnomalias(r.sem_anomalias ?? r.resultado_tudo_ok);
      setSugerirRepeticao(!!r.sugerir_repeticao);
      setFracaoFetal(r.fracao_fetal || '');
      setCromossomasSexuais(r.cromossomas_sexuais || '');
      setResultadoSexuais(r.resultado_cromossomas_sexuais || '');
      setIdAmostra(r.id_amostra || '');
      setDataEnvioLab(r.data_envio_laboratorio || '');
      setDataRecepcaoLab(r.data_recepcao_laboratorio || '');
      setDataRelatorioLab(r.data_relatorio_laboratorio || '');
      setDataResultado(r.data_resultado);
      setDataValidacao(r.data_validacao);
    } catch {
      setResultados(inicializarNegativo(analisados));
    } finally {
      setLoading(false);
    }
  }, [processo.id, processo.sub_teste_nome, processo.teste_pai_nome, processo.teste]);

  useEffect(() => { void load(); }, [load]);

  const estadoTerminal = processo.estado === 'Cancelado' || processo.estado === 'Faturado';
  const podeEditar = canUpdate && !estadoTerminal;
  const podeRegistar = podeEditar;
  const podeValidar = canUpdate && processo.estado === 'Resultado Disponivel';

  const setResultado = (numero: number, valor: string) => {
    setResultados((prev) => ({ ...prev, [numero]: valor }));
    if (temPositivoOuSuspeita(valor)) {
      setSemAnomalias(false);
      setSugerirRepeticao(false);
    }
  };

  const handleSemAnomalias = (checked: boolean) => {
    setSemAnomalias(checked);
    if (checked) {
      setSugerirRepeticao(false);
      setResultados(inicializarNegativo(analisados));
    } else {
      setResultados(inicializarNegativo(analisados));
    }
  };

  const handleSugerirRepeticao = (checked: boolean) => {
    setSugerirRepeticao(checked);
    if (checked) setSemAnomalias(false);
  };

  const registar = async () => {
    const semAnomaliasEfetivo = sugerirRepeticao
      ? false
      : (semAnomalias || derivarSemAnomalias(resultados, analisados, false));

    setBusy(true);
    try {
      await processosApi.registarResultados(processo.id, {
        sem_anomalias: semAnomaliasEfetivo,
        sugerir_repeticao: sugerirRepeticao,
        resultados_cromossomas: semAnomaliasEfetivo ? inicializarNegativo(analisados) : resultados,
        fracao_fetal: fracaoFetal || undefined,
        cromossomas_sexuais: cromossomasSexuais || undefined,
        resultado_cromossomas_sexuais: resultadoSexuais || undefined,
        id_amostra: idAmostra || undefined,
        data_envio_laboratorio: dataEnvioLab || undefined,
        data_recepcao_laboratorio: dataRecepcaoLab || undefined,
        data_relatorio_laboratorio: dataRelatorioLab || undefined,
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
      const res = await processosApi.validar(processo.id);
      const rel = res.relatorio_arquivo;
      if (rel?.skipped) {
        toast.success('Resultado validado. Relatório PDF inalterado.');
      } else if (rel?.anexo) {
        toast.success(`Resultado validado. ${rel.anexo.titulo} guardado nos anexos.`);
      } else {
        toast.success('Resultado validado.');
        toast.warning('O PDF automático não foi gerado. Use «Gerar PDF» no separador Relatório.');
      }
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

  const mostrarGrelha = !semAnomalias;

  const content = (
    <>
      <DrawerPanel className={variant === 'page' ? 'border-gray-200 dark:border-gray-700' : ''}>
        <DrawerPanelHeader title="Laboratório" icon={FlaskConical} />
        <DrawerPanelContent>
          <DrawerFieldGrid>
            <div>
              <div className={DRAWER.fieldLabel}>Envio laboratório</div>
              <MinDatePicker
                allowAnyDate
                allowExistingPastDate
                value={dataEnvioLab}
                onChange={setDataEnvioLab}
                disabled={!podeEditar}
                className={CONTROL.input}
              />
            </div>
            <div>
              <div className={DRAWER.fieldLabel}>Recepção laboratório</div>
              <MinDatePicker
                allowAnyDate
                allowExistingPastDate
                value={dataRecepcaoLab}
                onChange={setDataRecepcaoLab}
                disabled={!podeEditar}
                className={CONTROL.input}
              />
            </div>
            <div>
              <div className={DRAWER.fieldLabel}>Relatório laboratório</div>
              <MinDatePicker
                allowAnyDate
                allowExistingPastDate
                value={dataRelatorioLab}
                onChange={setDataRelatorioLab}
                disabled={!podeEditar}
                className={CONTROL.input}
              />
            </div>
            <div>
              <div className={DRAWER.fieldLabel}>ID amostra</div>
              <input
                value={idAmostra}
                onChange={(e) => setIdAmostra(e.target.value)}
                disabled={!podeEditar}
                className={CONTROL.input}
                placeholder="Ex.: AM-2026-001"
              />
            </div>
          </DrawerFieldGrid>
        </DrawerPanelContent>
      </DrawerPanel>

      <DrawerPanel>
        <DrawerPanelHeader title="Interpretação clínica" icon={FlaskConical} />
        <DrawerPanelContent>
          <DrawerFieldGrid>
            <div>
              <div className={DRAWER.fieldLabel}>Resultado crom. sexuais</div>
              <FormRadixSelect
                value={resultadoSexuais}
                onChange={setResultadoSexuais}
                disabled={!podeEditar}
                options={RESULTADOS_SEXUAIS.filter(Boolean).map((r) => ({ value: r, label: r }))}
                placeholder="—"
              />
            </div>
            <div>
              <div className={DRAWER.fieldLabel}>Cromossomas sexuais (ex. XX)</div>
              <input
                value={cromossomasSexuais}
                onChange={(e) => setCromossomasSexuais(e.target.value)}
                disabled={!podeEditar}
                className={CONTROL.input}
                placeholder="Ex.: XX, XY"
              />
            </div>
            <div>
              <div className={DRAWER.fieldLabel}>Fração fetal (%)</div>
              <input
                value={fracaoFetal}
                onChange={(e) => setFracaoFetal(e.target.value)}
                disabled={!podeEditar}
                className={CONTROL.input}
                placeholder="Ex.: 12.5"
                type="number"
                min={0}
                max={100}
                step="0.1"
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-[#3d4f6a]/50 dark:bg-[#151f30]/50">
                <input
                  type="checkbox"
                  checked={semAnomalias}
                  onChange={(e) => handleSemAnomalias(e.target.checked)}
                  disabled={!podeEditar || sugerirRepeticao}
                  className={CHECKBOX_INPUT_CLASS}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sem anomalias</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <input
                  type="checkbox"
                  checked={sugerirRepeticao}
                  onChange={(e) => handleSugerirRepeticao(e.target.checked)}
                  disabled={!podeEditar}
                  className={CHECKBOX_INPUT_CLASS}
                />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Sugerir repetição</span>
              </label>
            </div>
          </DrawerFieldGrid>

          {sugerirRepeticao && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Recomenda-se repetição da colheita. O relatório reflectirá esta conclusão.
            </div>
          )}
        </DrawerPanelContent>
      </DrawerPanel>

      <DrawerPanel>
        <DrawerPanelHeader
          title="Cromossomas"
          icon={FlaskConical}
          subtitle={`${kitLabel(processo)} · ${analisados.length} de 23 analisados`}
        />
        <DrawerPanelContent className="space-y-5">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-1.5" aria-label="Mapa dos 23 cromossomas">
              {NUMEROS.map((n) => {
                const analisado = analisados.includes(n);
                const valor = analisado ? (resultados[n] || Negativo) : undefined;
                const alerta = analisado && mostrarGrelha && temPositivoOuSuspeita(valor || '');
                return (
                  <div
                    key={n}
                    title={analisado ? `C${n}: ${valor}` : `C${n}: não analisado`}
                    className={`relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border text-xs font-bold transition-colors ${classeCelulaMapa(analisado, valor)}`}
                  >
                    <span className="leading-none">C{n}</span>
                    {alerta && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
                        !
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-600 dark:border-[#3d4f6a]/50 dark:bg-[#151f30]/40 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-4 w-4 rounded-md border border-slate-500/40 bg-slate-800/50" />
              Não analisado
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-4 w-4 rounded-md border border-emerald-500/50 bg-emerald-500/20" />
              Negativo
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-4 w-4 rounded-md border border-amber-500/60 bg-amber-500/25" />
              Positivo / Suspeita
            </span>
          </div>

          {mostrarGrelha && (
            <>
              <div className="rounded-lg border border-sky-300/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200/90">
                Por defeito todos vêm como «Negativo». Altera apenas o(s) cromossoma(s) com resultado Positivo ou Suspeita.
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {analisados.map((n) => {
                  const valor = resultados[n] || Negativo;
                  const anomalia = temPositivoOuSuspeita(valor);
                  return (
                    <div
                      key={n}
                      className={`rounded-xl border p-3 transition-colors ${cardClass(valor)}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-100">
                          C{n}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          anomalia
                            ? 'bg-amber-500/20 text-amber-200'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                        >
                          {anomalia ? 'Alterado' : 'Negativo'}
                        </span>
                      </div>
                      <FormRadixSelect
                        value={valor}
                        onChange={(v) => setResultado(n, v)}
                        disabled={!podeEditar}
                        options={CROMOSSOMA_SELECT_OPTIONS}
                        placeholder="Resultado"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {podeEditar && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-[#3d4f6a]/40">
              <button type="button" onClick={registar} disabled={busy} className={CONTROL.buttonPrimary}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                Registar resultado
              </button>
              <button
                type="button"
                onClick={validar}
                disabled={!podeValidar || busy}
                className={`${CONTROL.buttonSecondary} border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20`}
              >
                <CheckCircle2 className="h-4 w-4" /> Validar
              </button>
            </div>
          )}
        </DrawerPanelContent>
      </DrawerPanel>

      {(dataResultado || dataValidacao) && (
        <DrawerPanel>
          <DrawerPanelHeader title="Datas de registo" icon={CheckCircle2} />
          <DrawerPanelContent>
            <DrawerFieldGrid>
              <DrawerField label="Data do resultado" value={fmt(dataResultado)} />
              <DrawerField label="Data de validação" value={fmt(dataValidacao)} />
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
