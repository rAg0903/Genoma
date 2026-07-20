import { useMemo } from 'react';
import {
  calcularDataPartoPrevista,
  calcularGestacaoAtual,
  formatDataPartoPt,
  parseGestacaoRegistoInput,
} from '../../lib/gestacao';
import { useLanguage } from '../../i18n/LanguageContext';
import { CONTROL, FORM } from '../../lib/design-tokens';

interface GestacaoFieldsProps {
  semanasRegisto: string;
  diasRegisto: string;
  dataRegisto: string;
  onSemanasChange: (value: string) => void;
  onDiasChange: (value: string) => void;
  inputClass: string;
}

function clampNumeric(value: string, max: number) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const n = Math.min(max, Number.parseInt(digits, 10));
  return Number.isNaN(n) ? '' : String(n);
}

function MetricPair({
  label,
  semanas,
  dias,
  semanasLabel = 'Semanas',
  diasLabel = 'Dias',
  editable,
  onSemanasChange,
  onDiasChange,
  inputClass,
  computed,
}: {
  label: string;
  semanas: string;
  dias: string;
  semanasLabel?: string;
  diasLabel?: string;
  editable?: boolean;
  onSemanasChange?: (value: string) => void;
  onDiasChange?: (value: string) => void;
  inputClass: string;
  computed?: boolean;
}) {
  const fieldClass = computed
    ? `${inputClass} ${FORM.readOnlyInput} ${CONTROL.numberInput} text-center tabular-nums w-[4.75rem]`
    : `${inputClass} ${CONTROL.numberInput} text-center tabular-nums w-[4.75rem]`;

  return (
    <div className="min-w-0">
      <div className={FORM.labelArea}>
        <p className={`${FORM.label} ${computed ? 'text-slate-400 dark:text-slate-500' : ''}`}>{label}</p>
      </div>
      <div className="mt-1.5 flex items-start gap-3">
        <div>
          <input
            type="text"
            inputMode="numeric"
            readOnly={!editable}
            tabIndex={editable ? 0 : -1}
            className={fieldClass}
            value={semanas}
            onChange={editable && onSemanasChange
              ? (e) => onSemanasChange(clampNumeric(e.target.value, 42))
              : undefined}
            placeholder="0"
          />
          <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-500">{semanasLabel}</span>
        </div>
        <div>
          <input
            type="text"
            inputMode="numeric"
            readOnly={!editable}
            tabIndex={editable ? 0 : -1}
            className={fieldClass}
            value={dias}
            onChange={editable && onDiasChange
              ? (e) => onDiasChange(clampNumeric(e.target.value, 6))
              : undefined}
            placeholder="0"
          />
          <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-500">{diasLabel}</span>
        </div>
      </div>
    </div>
  );
}

export function GestacaoFields({
  semanasRegisto,
  diasRegisto,
  dataRegisto,
  onSemanasChange,
  onDiasChange,
  inputClass,
}: GestacaoFieldsProps) {
  const { t } = useLanguage();
  const calculos = useMemo(() => {
    const registo = parseGestacaoRegistoInput(semanasRegisto, diasRegisto);
    if (!registo || !dataRegisto) return null;
    const atual = calcularGestacaoAtual(registo.semanas, registo.dias, dataRegisto);
    const parto = calcularDataPartoPrevista(registo.semanas, registo.dias, dataRegisto);
    return { atual, parto };
  }, [semanasRegisto, diasRegisto, dataRegisto]);

  return (
    <div className="w-full max-w-3xl">
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${FORM.metricGroup}`}>
        <MetricPair
          label={t('form.gestacao.registro')}
          semanas={semanasRegisto}
          dias={diasRegisto}
          semanasLabel={t('form.units.weeks')}
          diasLabel={t('form.units.days')}
          editable
          onSemanasChange={onSemanasChange}
          onDiasChange={onDiasChange}
          inputClass={inputClass}
        />
        <MetricPair
          label={t('form.gestacao.actual')}
          semanas={calculos?.atual ? String(calculos.atual.semanas) : ''}
          dias={calculos?.atual ? String(calculos.atual.dias) : ''}
          semanasLabel={t('form.units.weeks')}
          diasLabel={t('form.units.days')}
          inputClass={inputClass}
          computed
        />
        <div className="min-w-0">
          <div className={FORM.labelArea}>
            <p className={`${FORM.label} text-slate-400 dark:text-slate-500`}>{t('form.gestacao.dueDate')}</p>
          </div>
          <input
            readOnly
            tabIndex={-1}
            className={`${inputClass} ${FORM.readOnlyInput} mt-1.5 tabular-nums w-[9.25rem]`}
            value={calculos?.parto ? formatDataPartoPt(calculos.parto) : ''}
            placeholder="—"
          />
          <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-500">{t('form.gestacao.autoCalculated')}</span>
        </div>
      </div>
    </div>
  );
}
