import { ReactNode } from 'react';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { todayLocal, formatCalendarDatePt } from '../../../lib/dates';
import { CONTROL, DETAIL, FORM } from '../../../lib/design-tokens';
import { ProcessFaturacaoData } from '../../../lib/process-form';
import { InfoField } from '../ContactDetail';
import { FormField, FormInput, FormNumberInput, FormSelect } from './FormPageChrome';

const readOnlyClass = `${CONTROL.input} ${FORM.readOnlyInput}`;

const fmt = (value?: string) => formatCalendarDatePt(value);
const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} €`;

interface ProcessFaturacaoFieldsProps {
  value: ProcessFaturacaoData;
  onChange: (value: ProcessFaturacaoData) => void;
  canUpdate?: boolean;
}

function FaturacaoSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 dark:text-slate-500 mb-3">
        {title}
      </h3>
      <div className={FORM.fieldRow}>{children}</div>
    </div>
  );
}

export function ProcessFaturacaoFields({ value, onChange, canUpdate = true }: ProcessFaturacaoFieldsProps) {
  const set = (patch: Partial<ProcessFaturacaoData>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      <FaturacaoSubsection title="Valores">
        <FormField label="Preço do teste" width="md">
          <div className="relative">
            <FormNumberInput
              min={0}
              value={String(value.valor_base ?? 0)}
              onChange={(e) => {
                const valorBase = Number(e.target.value.replace(',', '.') || 0);
                set({
                  valor_base: valorBase,
                  valor_final: Number((valorBase * (1 - Number(value.desconto_percentual || 0) / 100)).toFixed(2)),
                });
              }}
              className="pr-8"
              disabled={!canUpdate}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
          </div>
        </FormField>
        <FormField label="Desconto (%)" width="sm">
          <FormNumberInput
            inputMode="decimal"
            value={String(value.desconto_percentual ?? 0)}
            onChange={(e) => set({
              desconto_percentual: Number(e.target.value.replace(',', '.') || 0),
              valor_final: Number((Number(value.valor_base || 0) * (1 - Number(e.target.value.replace(',', '.') || 0) / 100)).toFixed(2)),
            })}
            disabled={!canUpdate}
          />
        </FormField>
        <div className={`${FORM.fieldWidth.md} flex items-end`}>
          <button
            type="button"
            onClick={() => set({
              desconto_percentual: 10,
              valor_final: Number((Number(value.valor_base || 0) * 0.9).toFixed(2)),
            })}
            disabled={!canUpdate}
            className={`${CONTROL.buttonSecondary} w-full justify-center h-9`}
          >
            Aplicar 10% médico
          </button>
        </div>
        <div className={`${FORM.fieldWidth.lg} flex items-end pb-2`}>
          <label className={`${FORM.checkboxRow} inline-flex`}>
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
      </FaturacaoSubsection>

      <div className={DETAIL.divider} />

      <FaturacaoSubsection title="Documento de fatura">
        <FormField label="Nº fatura" width="md">
          <FormInput
            type="text"
            value={value.fatura_numero || ''}
            onChange={(e) => set({ fatura_numero: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label="Data fatura" width="sm">
          <FormInput
            type="date"
            value={value.fatura_data_emissao || ''}
            onChange={(e) => set({ fatura_data_emissao: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label="Valor fatura" width="md">
          <input
            type="text"
            readOnly
            value={formatMoney(value.valor_final ?? 0)}
            className={readOnlyClass}
          />
        </FormField>
      </FaturacaoSubsection>

      <div className={DETAIL.divider} />

      <FaturacaoSubsection title="Multibanco e envio">
        <FormField label="Entidade multibanco" width="sm">
          <FormInput
            type="text"
            value={value.entidade_multibanco || ''}
            onChange={(e) => set({ entidade_multibanco: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label="Referência multibanco" width="lg">
          <FormInput
            type="text"
            value={value.referencia_multibanco || ''}
            onChange={(e) => set({ referencia_multibanco: e.target.value })}
            className="font-mono tabular-nums"
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label="Data envio email" width="sm">
          <FormInput
            type="date"
            value={value.fatura_envio_email || ''}
            onChange={(e) => set({ fatura_envio_email: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label="Data envio SMS" width="sm">
          <FormInput
            type="date"
            value={value.fatura_envio_sms || ''}
            onChange={(e) => set({ fatura_envio_sms: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
      </FaturacaoSubsection>

      <div className={DETAIL.divider} />

      <div className="space-y-4">
        <label className={`${FORM.checkboxRow} inline-flex`}>
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
          <span className="font-medium">Marcar como pago</span>
        </label>
        {value.pago && (
          <div className={FORM.fieldRow}>
            <FormField label="Data pagamento" width="sm">
              <FormInput
                type="date"
                value={value.pagamento_data || ''}
                onChange={(e) => set({ pagamento_data: e.target.value, pago: e.target.value ? true : value.pago })}
                disabled={!canUpdate}
              />
            </FormField>
            <FormField label="Nº recibo" width="md">
              <FormInput
                type="text"
                value={value.recibo_numero || ''}
                onChange={(e) => set({ recibo_numero: e.target.value })}
                className="font-mono"
                disabled={!canUpdate}
              />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProcessFaturacaoView({ value }: { value: ProcessFaturacaoData }) {
  return (
    <div className={DETAIL.grid}>
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
