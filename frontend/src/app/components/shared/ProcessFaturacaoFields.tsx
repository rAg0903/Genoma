import { useMemo, type ReactNode } from 'react';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { todayLocal, formatCalendarDatePt, maxCalendarDate, normalizeCalendarDate } from '../../../lib/dates';
import { CONTROL, DETAIL, FORM } from '../../../lib/design-tokens';
import { ProcessFaturacaoData, isDocumentoFaturaCompleto } from '../../../lib/process-form';
import { useLanguage } from '../../../i18n/LanguageContext';
import { InfoField } from './DetailLayout';
import { FormField, FormInput, FormNumberInput, FormSelect, FormFieldAccessory } from './FormPageChrome';
import { FormDatePicker } from './FormDatePicker';

const readOnlyClass = `${CONTROL.input} ${FORM.readOnlyInput}`;

const fmt = (value?: string) => formatCalendarDatePt(value);
const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} €`;

interface ProcessFaturacaoFieldsProps {
  value: ProcessFaturacaoData;
  onChange: (value: ProcessFaturacaoData) => void;
  canUpdate?: boolean;
  showMultibancoEnvio?: boolean;
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

export function ProcessFaturacaoFields({ value, onChange, canUpdate = true, showMultibancoEnvio = true }: ProcessFaturacaoFieldsProps) {
  const { t } = useLanguage();
  const documentoCompleto = isDocumentoFaturaCompleto(value);
  const paymentMinDate = useMemo(
    () => maxCalendarDate(todayLocal(), value.fatura_data_emissao),
    [value.fatura_data_emissao],
  );

  const set = (patch: Partial<ProcessFaturacaoData>) => {
    const next = { ...value, ...patch };
    const paymentMin = maxCalendarDate(todayLocal(), next.fatura_data_emissao);
    if (next.pagamento_data) {
      const normalizedPayment = normalizeCalendarDate(next.pagamento_data);
      if (normalizedPayment && normalizedPayment < paymentMin) {
        next.pagamento_data = paymentMin;
      }
    }
    if (!isDocumentoFaturaCompleto(next) && next.pago) {
      onChange({ ...next, pago: false, pagamento_data: '', recibo_numero: '' });
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <FaturacaoSubsection title={t('faturacao.fields.values')}>
        <FormField label={t('faturacao.fields.testPrice')} width="md">
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
        <FormField label={t('faturacao.fields.discount')} width="sm">
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
        <FormFieldAccessory width="md">
          <button
            type="button"
            onClick={() => set({
              desconto_percentual: 10,
              valor_final: Number((Number(value.valor_base || 0) * 0.9).toFixed(2)),
            })}
            disabled={!canUpdate}
            className={`${CONTROL.buttonSecondary} w-full justify-center h-9`}
          >
            {t('faturacao.fields.applyDoctorDiscount')}
          </button>
        </FormFieldAccessory>
        <FormFieldAccessory width="lg">
          <label className={`${FORM.checkboxRow} inline-flex`}>
            <input
              type="checkbox"
              checked={!!value.nao_gera_comissao}
              onChange={(e) => set({ nao_gera_comissao: e.target.checked })}
              disabled={!canUpdate}
              className={CHECKBOX_INPUT_CLASS}
            />
            {t('faturacao.fields.noCommission')}
          </label>
        </FormFieldAccessory>
      </FaturacaoSubsection>

      <div className={DETAIL.divider} />

      <FaturacaoSubsection title={t('faturacao.fields.invoiceDocument')}>
        <FormField label={t('faturacao.fields.invoiceNumber')} width="md">
          <FormInput
            type="text"
            value={value.fatura_numero || ''}
            onChange={(e) => set({ fatura_numero: e.target.value })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label={t('faturacao.fields.invoiceDate')} width="sm">
          <FormDatePicker
            value={value.fatura_data_emissao || ''}
            onChange={(v) => set({ fatura_data_emissao: v })}
            disabled={!canUpdate}
          />
        </FormField>
        <FormField label={t('faturacao.fields.invoiceAmount')} width="md">
          <input
            type="text"
            readOnly
            value={formatMoney(value.valor_final ?? 0)}
            className={readOnlyClass}
          />
        </FormField>
      </FaturacaoSubsection>

      {showMultibancoEnvio && (
        <>
          <div className={DETAIL.divider} />

          <FaturacaoSubsection title={t('faturacao.fields.multibancoSection')}>
            <FormField label={t('faturacao.fields.multibancoEntity')} width="sm">
              <FormInput
                type="text"
                value={value.entidade_multibanco || ''}
                onChange={(e) => set({ entidade_multibanco: e.target.value })}
                disabled={!canUpdate}
              />
            </FormField>
            <FormField label={t('faturacao.fields.multibancoReference')} width="lg">
              <FormInput
                type="text"
                value={value.referencia_multibanco || ''}
                onChange={(e) => set({ referencia_multibanco: e.target.value })}
                className="font-mono tabular-nums"
                disabled={!canUpdate}
              />
            </FormField>
            <FormField label={t('faturacao.fields.emailSentDate')} width="sm">
              <FormDatePicker
                value={value.fatura_envio_email || ''}
                onChange={(v) => set({ fatura_envio_email: v })}
                disabled={!canUpdate}
              />
            </FormField>
            <FormField label={t('faturacao.fields.smsSentDate')} width="sm">
              <FormDatePicker
                value={value.fatura_envio_sms || ''}
                onChange={(v) => set({ fatura_envio_sms: v })}
                disabled={!canUpdate}
              />
            </FormField>
          </FaturacaoSubsection>
        </>
      )}

      <div className={DETAIL.divider} />

      <div className="space-y-4">
        <label className={`${FORM.checkboxRow} inline-flex ${!documentoCompleto ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={!!value.pago}
            onChange={(e) => set({
              pago: e.target.checked,
              pagamento_data: e.target.checked
                ? (
                  value.pagamento_data
                  && normalizeCalendarDate(value.pagamento_data) >= paymentMinDate
                    ? value.pagamento_data
                    : paymentMinDate
                )
                : value.pagamento_data,
            })}
            disabled={!canUpdate || !documentoCompleto}
            className={CHECKBOX_INPUT_CLASS}
          />
          <span className="font-medium">{t('faturacao.fields.markPaid')}</span>
        </label>
        {!documentoCompleto && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('faturacao.fields.markPaidHint')}
          </p>
        )}
        {value.pago && (
          <div className={FORM.fieldRow}>
            <FormField label={t('faturacao.fields.paymentDate')} width="sm">
              <FormDatePicker
                value={value.pagamento_data || ''}
                onChange={(v) => set({ pagamento_data: v, pago: v ? true : value.pago })}
                disabled={!canUpdate}
                allowAnyDate={false}
                minDate={paymentMinDate}
                allowExistingPastDate
              />
            </FormField>
            <FormField label={t('faturacao.fields.receiptNumber')} width="md">
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

export function ProcessFaturacaoView({ value, showMultibancoEnvio = true }: { value: ProcessFaturacaoData; showMultibancoEnvio?: boolean }) {
  const { t } = useLanguage();
  const yesNo = (v: boolean) => (v ? t('faturacao.fields.yes') : t('faturacao.fields.no'));

  return (
    <div className={DETAIL.grid}>
      <InfoField label={t('faturacao.fields.testPrice')} value={formatMoney(value.valor_base)} />
      <InfoField label={t('faturacao.fields.noCommission')} value={yesNo(!!value.nao_gera_comissao)} />
      <InfoField label={t('faturacao.fields.discount')} value={String(value.desconto_percentual ?? 0)} />
      <InfoField label={t('faturacao.fields.invoiceNumber')} value={value.fatura_numero || ''} mono />
      <InfoField label={t('faturacao.fields.invoiceDate')} value={fmt(value.fatura_data_emissao)} />
      <InfoField label={t('faturacao.fields.invoiceAmount')} value={formatMoney(value.valor_final)} />
      {showMultibancoEnvio && (
        <>
          <InfoField label={t('faturacao.fields.multibancoEntity')} value={value.entidade_multibanco || ''} />
          <InfoField label={t('faturacao.fields.multibancoReference')} value={value.referencia_multibanco || ''} mono />
          <InfoField label={t('faturacao.fields.emailSentDate')} value={fmt(value.fatura_envio_email)} />
          <InfoField label={t('faturacao.fields.smsSentDate')} value={fmt(value.fatura_envio_sms)} />
        </>
      )}
      <InfoField label={t('faturacao.fields.paid')} value={yesNo(!!value.pago)} />
      {value.pago && (
        <>
          <InfoField label={t('faturacao.fields.paymentDate')} value={fmt(value.pagamento_data)} />
          <InfoField label={t('faturacao.fields.receiptNumber')} value={value.recibo_numero || ''} mono />
        </>
      )}
    </div>
  );
}
