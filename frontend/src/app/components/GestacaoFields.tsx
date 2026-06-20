import { useMemo } from 'react';
import {
  calcularDataPartoPrevista,
  calcularGestacaoAtual,
  formatDataPartoPt,
  parseGestacaoRegistoInput,
} from '../../lib/gestacao';

const readOnlyInputClass =
  'w-16 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-center';

interface GestacaoFieldsProps {
  semanasRegisto: string;
  diasRegisto: string;
  dataRegisto: string;
  onSemanasChange: (value: string) => void;
  onDiasChange: (value: string) => void;
  labelClass: string;
  inputClass: string;
}

export function GestacaoFields({
  semanasRegisto,
  diasRegisto,
  dataRegisto,
  onSemanasChange,
  onDiasChange,
  labelClass,
  inputClass,
}: GestacaoFieldsProps) {
  const calculos = useMemo(() => {
    const registo = parseGestacaoRegistoInput(semanasRegisto, diasRegisto);
    if (!registo || !dataRegisto) return null;
    const atual = calcularGestacaoAtual(registo.semanas, registo.dias, dataRegisto);
    const parto = calcularDataPartoPrevista(registo.semanas, registo.dias, dataRegisto);
    return { atual, parto };
  }, [semanasRegisto, diasRegisto, dataRegisto]);

  return (
    <>
      <div className="sm:col-span-2">
        <label className={labelClass} style={{ fontSize: '13px' }}>
          Tempo de gestação (data registo)
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={42}
              className={inputClass}
              style={{ fontSize: '14px', width: '4.5rem' }}
              value={semanasRegisto}
              onChange={(e) => onSemanasChange(e.target.value)}
              placeholder="0"
            />
            <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>semanas</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={6}
              className={inputClass}
              style={{ fontSize: '14px', width: '4.5rem' }}
              value={diasRegisto}
              onChange={(e) => onDiasChange(e.target.value)}
              placeholder="0"
            />
            <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>dias</span>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={`${labelClass} text-gray-400 dark:text-gray-500`} style={{ fontSize: '13px' }}>
          Tempo de gestação (actual)
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              readOnly
              tabIndex={-1}
              className={readOnlyInputClass}
              style={{ fontSize: '14px' }}
              value={calculos?.atual ? String(calculos.atual.semanas) : ''}
            />
            <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>semanas</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              tabIndex={-1}
              className={readOnlyInputClass}
              style={{ fontSize: '14px' }}
              value={calculos?.atual ? String(calculos.atual.dias) : ''}
            />
            <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>dias</span>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={`${labelClass} text-gray-400 dark:text-gray-500`} style={{ fontSize: '13px' }}>
          Data prevista do parto
        </label>
        <div className="flex items-center gap-3">
          <input
            readOnly
            tabIndex={-1}
            className={`${inputClass} bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 max-w-[10rem]`}
            style={{ fontSize: '14px' }}
            value={calculos?.parto ? formatDataPartoPt(calculos.parto) : ''}
          />
          <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>dd/mm/aaaa</span>
        </div>
      </div>
    </>
  );
}
