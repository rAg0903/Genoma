import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { todayLocal, formatCalendarDatePt, maxCalendarDate, normalizeCalendarDate } from '../../../lib/dates';
import { CONTROL, DETAIL, FORM } from '../../../lib/design-tokens';
import {
  ProcessFaturacaoData,
  isDocumentoFaturaCompleto,
  computeValorFinal,
  sanitizeDecimalInput,
  parseDecimalInput,
  formatDecimalInput,
} from '../../../lib/process-form';
import {
  describeFaturacaoWorkflowPlacement,
  resolveFaturacaoWorkflowMinDate,
  sanitizeFaturacaoDataEmissao,
  validateFaturacaoWorkflowDate,
  WorkflowMilestoneDates,
} from '../../../lib/workflow-faturacao';
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
  workflowDates: WorkflowMilestoneDates;
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

export function ProcessFaturacaoFields({
  value,
  onChange,
  canUpdate = true,
  showMultibancoEnvio = false,
  workflowDates,
}: ProcessFaturacaoFieldsProps) {
  const { t } = useLanguage();
  const documentoCompleto = isDocumentoFaturaCompleto(value);
  const [discountInput, setDiscountInput] = useState(() => formatDecimalInput(value.desconto_percentual));
  const lastExternalDiscount = useRef(value.desconto_percentual);
  const invoiceMinDate = useMemo(
    () => resolveFaturacaoWorkflowMinDate(workflowDates),
    [workflowDates],
  );
  const paymentMinDate = useMemo(
    () => maxCalendarDate(todayLocal(), value.fatura_data_emissao),
    [value.fatura_data_emissao],
  );
  const workflowPlacement = useMemo(
    () => describeFaturacaoWorkflowPlacement(workflowDates, value.fatura_data_emissao),
    [workflowDates, value.fatura_data_emissao],
  );
  const workflowDateError = useMemo(
    () => validateFaturacaoWorkflowDate(workflowDates, value.fatura_data_emissao),
    [workflowDates, value.fatura_data_emissao],
  );

  useEffect(() => {
    if (value.desconto_percentual === lastExternalDiscount.current) return;
    const parsedFromInput = parseDecimalInput(discountInput);
    if (Math.abs(parsedFromInput - Number(value.desconto_percentual ?? 0)) > 1e-9) {
      setDiscountInput(formatDecimalInput(value.desconto_percentual));
    }
    lastExternalDiscount.current = value.desconto_percentual;
  }, [value.desconto_percentual, discountInput]);

  const applyDiscount = (raw: string) => {
    const sanitized = sanitizeDecimalInput(raw);
    setDiscountInput(sanitized);
    const parsed = parseDecimalInput(sanitized);
    lastExternalDiscount.current = parsed;
    set({
      desconto_percentual: parsed,
      valor_final: computeValorFinal(Number(value.valor_base || 0), parsed),
    });
  };

  const set = (patch: Partial<ProcessFaturacaoData>) => {
    const next = { ...value, ...patch };
    if (patch.fatura_data_emissao !== undefined) {
      next.fatura_data_emissao = sanitizeFaturacaoDataEmissao(workflowDates, patch.fatura_data_emissao);
    }
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
            value={discountInput}
            onChange={(e) => applyDiscount(e.target.value)}
            onBlur={() => setDiscountInput(formatDecimalInput(parseDecimalInput(discountInput)))}
            disabled={!canUpdate}
          />
        </FormField>
        <FormFieldAccessory width="md">
          <button
            type="button"
            onClick={() => {
              setDiscountInput('10');
              lastExternalDiscount.current = 10;
              set({
                desconto_percentual: 10,
                valor_final: computeValorFinal(Number(value.valor_base || 0), 10),
              });
            }}
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
            disabled={!canUpdate || !invoiceMinDate}
            minDate={invoiceMinDate}
            allowAnyDate={false}
          />
        </FormField>
        {!invoiceMinDate && (
          <FormFieldAccessory width="lg">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina primeiro a data de entrada do processo para registar a fatura.
            </p>
          </FormFieldAccessory>
        )}
        {workflowPlacement && !workflowDateError && (
          <FormFieldAccessory width="lg">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No workflow do processo, esta fatura aparece {workflowPlacement}.
            </p>
          </FormFieldAccessory>
        )}
        {workflowDateError && (
          <FormFieldAccessory width="lg">
            <p className="text-xs text-rose-600 dark:text-rose-400">{workflowDateError}</p>
          </FormFieldAccessory>
        )}
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

export function ProcessFaturacaoView({ value, showMultibancoEnvio = false }: { value: ProcessFaturacaoData; showMultibancoEnvio?: boolean }) {
  const { t } = useLanguage();
  const yesNo = (v: boolean) => (v ? t('faturacao.fields.yes') : t('faturacao.fields.no'));

  return (
    <div className={DETAIL.grid}>
      <InfoField label={t('faturacao.fields.testPrice')} value={formatMoney(value.valor_base)} />
      <InfoField label={t('faturacao.fields.noCommission')} value={yesNo(!!value.nao_gera_comissao)} />
      <InfoField label={t('faturacao.fields.discount')} value={formatDecimalInput(value.desconto_percentual)} />
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
