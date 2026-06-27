import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { todayLocal, formatCalendarDatePt } from '../../../lib/dates';
import { ProcessFaturacaoData } from '../../../lib/process-form';
import { InfoField } from '../ContactDetail';

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
const readOnlyClass = `${inputClass} bg-gray-50 dark:bg-gray-800/80 cursor-default focus:ring-0`;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

const fmt = (value?: string) => formatCalendarDatePt(value);
const formatMoney = (value?: number) => `${Number(value || 0).toFixed(2)} €`;

interface ProcessFaturacaoFieldsProps {
  value: ProcessFaturacaoData;
  onChange: (value: ProcessFaturacaoData) => void;
  canUpdate?: boolean;
}

export function ProcessFaturacaoFields({ value, onChange, canUpdate = true }: ProcessFaturacaoFieldsProps) {
  const set = (patch: Partial<ProcessFaturacaoData>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass} style={{ fontSize: '13px' }}>Preço do teste</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step="0.01"
              value={value.valor_base ?? 0}
              onChange={(e) => {
                const valorBase = Number(e.target.value || 0);
                set({
                  valor_base: valorBase,
                  valor_final: Number((valorBase * (1 - Number(value.desconto_percentual || 0) / 100)).toFixed(2)),
                });
              }}
              className={`${inputClass} pr-8`}
              style={{ fontSize: '14px' }}
              disabled={!canUpdate}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" style={{ fontSize: '14px' }}>€</span>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 pb-2 text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={!!value.nao_gera_comissao}
            onChange={(e) => set({ nao_gera_comissao: e.target.checked })}
            disabled={!canUpdate}
            className={CHECKBOX_INPUT_CLASS}
          />
          Não gera comissão
        </label>
      </div>

      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Desconto (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={value.desconto_percentual ?? 0}
          onChange={(e) => set({
            desconto_percentual: Number(e.target.value || 0),
            valor_final: Number((Number(value.valor_base || 0) * (1 - Number(e.target.value || 0) / 100)).toFixed(2)),
          })}
          className={inputClass}
          style={{ fontSize: '14px' }}
          disabled={!canUpdate}
        />
      </div>
      <div className="flex items-end">
        <button
          type="button"
          onClick={() => set({
            desconto_percentual: 10,
            valor_final: Number((Number(value.valor_base || 0) * 0.9).toFixed(2)),
          })}
          disabled={!canUpdate}
          className="w-full px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50"
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          Aplicar 10% Médico
        </button>
      </div>

      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Nº Fatura</label>
        <input type="text" value={value.fatura_numero || ''} onChange={(e) => set({ fatura_numero: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Data Fatura</label>
        <input type="date" value={value.fatura_data_emissao || ''} onChange={(e) => set({ fatura_data_emissao: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Valor Fatura</label>
        <input type="text" readOnly value={`${Number(value.valor_final ?? 0).toFixed(2)} €`} className={readOnlyClass} style={{ fontSize: '14px' }} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Entidade Multibanco</label>
        <input type="text" value={value.entidade_multibanco || ''} onChange={(e) => set({ entidade_multibanco: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Referência Multibanco</label>
        <input type="text" value={value.referencia_multibanco || ''} onChange={(e) => set({ referencia_multibanco: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Data Envio Email</label>
        <input type="date" value={value.fatura_envio_email || ''} onChange={(e) => set({ fatura_envio_email: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>
      <div>
        <label className={labelClass} style={{ fontSize: '13px' }}>Data Envio SMS</label>
        <input type="date" value={value.fatura_envio_sms || ''} onChange={(e) => set({ fatura_envio_sms: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
      </div>

      <div className="sm:col-span-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={!!value.pago}
            onChange={(e) => set({
              pago: e.target.checked,
              pagamento_data: e.target.checked && !value.pagamento_data ? todayLocal() : value.pagamento_data,
            })}
            disabled={!canUpdate}
            className={CHECKBOX_INPUT_CLASS}
          />
          Pago
        </label>
      </div>
      {value.pago && (
        <>
          <div>
            <label className={labelClass} style={{ fontSize: '13px' }}>Data Pagamento</label>
            <input type="date" value={value.pagamento_data || ''} onChange={(e) => set({ pagamento_data: e.target.value, pago: e.target.value ? true : value.pago })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
          </div>
          <div>
            <label className={labelClass} style={{ fontSize: '13px' }}>Nº Recibo</label>
            <input type="text" value={value.recibo_numero || ''} onChange={(e) => set({ recibo_numero: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
          </div>
        </>
      )}
    </div>
  );
}

export function ProcessFaturacaoView({ value }: { value: ProcessFaturacaoData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <InfoField label="Preço do teste" value={formatMoney(value.valor_base)} />
      <InfoField label="Não gera comissão" value={value.nao_gera_comissao ? 'Sim' : 'Não'} />
      <InfoField label="Desconto (%)" value={String(value.desconto_percentual ?? 0)} />
      <InfoField label="Nº Fatura" value={value.fatura_numero || ''} mono />
      <InfoField label="Data Fatura" value={fmt(value.fatura_data_emissao)} />
      <InfoField label="Valor Fatura" value={formatMoney(value.valor_final)} />
      <InfoField label="Entidade Multibanco" value={value.entidade_multibanco || ''} />
      <InfoField label="Referência Multibanco" value={value.referencia_multibanco || ''} mono />
      <InfoField label="Data Envio Email" value={fmt(value.fatura_envio_email)} />
      <InfoField label="Data Envio SMS" value={fmt(value.fatura_envio_sms)} />
      <InfoField label="Pago" value={value.pago ? 'Sim' : 'Não'} />
      {value.pago && (
        <>
          <InfoField label="Data Pagamento" value={fmt(value.pagamento_data)} />
          <InfoField label="Nº Recibo" value={value.recibo_numero || ''} mono />
        </>
      )}
    </div>
  );
}
