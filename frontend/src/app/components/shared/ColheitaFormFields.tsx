import { Loader2, MapPin, Package } from 'lucide-react';
import { Posto } from '../../data/types';
import { ColheitaFormState, PERIODO_COLHEITA_OPTIONS } from '../../../lib/colheita';
import { formatCalendarDatePt } from '../../../lib/dates';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { FORM } from '../../../lib/design-tokens';
import { FormDatePicker } from './FormDatePicker';
import { FormField, FormInlineAlert, FormInput, FormRadixSelect } from './FormPageChrome';

type Props = {
  value: ColheitaFormState;
  onChange: (patch: Partial<ColheitaFormState>) => void;
  selectedPosto?: Posto | null;
  disabled?: boolean;
  showPostoInfo?: boolean;
};

export type ColheitaKitOption = {
  id: string;
  codigo_barras: string;
  tracking: string;
  tipo_kit: string;
  teste_nome?: string;
  data_validade: string;
};

type KitPickerProps = {
  kits: ColheitaKitOption[];
  loading: boolean;
  disabled?: boolean;
  localeTag: string;
  onSelect: (kit: ColheitaKitOption) => void;
  labels: {
    title: string;
    loading: string;
    empty: string;
    defaultKit: string;
    validity: (date: string) => string;
  };
};

export function ColheitaPostoInfo({ posto }: { posto: Posto }) {
  const morada = [posto.morada, posto.codigo_postal, posto.cidade].filter(Boolean).join(', ');
  return (
    <FormInlineAlert tone="info" className="mb-4">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 space-y-0.5 text-sm">
        <div className="font-semibold text-slate-800 dark:text-slate-100">{posto.nome}</div>
        {morada ? <div>{morada}</div> : null}
        {posto.contacto ? <div>Tel. {posto.contacto}</div> : null}
        {posto.notas ? <div>{posto.notas}</div> : null}
      </div>
    </FormInlineAlert>
  );
}

/** Lista de kits disponíveis no posto seleccionado (contacto / agendamento). */
export function ColheitaKitPicker({
  kits,
  loading,
  disabled = false,
  localeTag,
  onSelect,
  labels,
}: KitPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{labels.loading}</span>
      </div>
    );
  }

  if (kits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
        <Package className="mx-auto mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{labels.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{labels.title}</p>
      {kits.map((k) => (
        <button
          key={k.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(k)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-700 dark:hover:bg-teal-950/30"
        >
          <div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{k.codigo_barras}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {k.teste_nome || k.tipo_kit || labels.defaultKit}
              {k.data_validade
                ? labels.validity(formatCalendarDatePt(k.data_validade))
                : ''}
            </div>
          </div>
          <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </button>
      ))}
    </div>
  );
}

/** Campos clínicos adicionais da colheita (usados na ficha do processo). */
export function ColheitaDetalheFields({ value, onChange, selectedPosto, disabled = false, showPostoInfo = true }: Props) {
  return (
    <div className="space-y-4">
      {showPostoInfo && selectedPosto ? <ColheitaPostoInfo posto={selectedPosto} /> : null}

      <div className={FORM.fieldRow}>
        <FormField label="Período" width="sm">
          <FormRadixSelect
            value={value.periodo}
            onChange={(v) => onChange({ periodo: v as ColheitaFormState['periodo'] })}
            disabled={disabled}
            placeholder="Selecionar"
            options={PERIODO_COLHEITA_OPTIONS}
          />
        </FormField>
        <FormField label="Data recepção amostra" width="sm">
          <FormDatePicker
            value={value.data_recepcao_amostra}
            onChange={(v) => onChange({ data_recepcao_amostra: v })}
            disabled={disabled}
            allowAnyDate
            allowExistingPastDate
            placeholder="dd/mm/aaaa"
          />
        </FormField>
      </div>

      <div className={`${FORM.fieldRow} items-end`}>
        <FormField label="Gestação na colheita (sem.)" width="xs">
          <FormInput
            type="number"
            min={0}
            max={45}
            value={value.semanas_gestacao}
            onChange={(e) => onChange({ semanas_gestacao: e.target.value })}
            disabled={disabled}
            placeholder="0–45"
          />
        </FormField>
        <FormField label="Gestação na colheita (dias)" width="xs">
          <FormInput
            type="number"
            min={0}
            max={6}
            value={value.dias_gestacao}
            onChange={(e) => onChange({ dias_gestacao: e.target.value })}
            disabled={disabled}
            placeholder="0–6"
          />
        </FormField>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className={`${FORM.checkboxRow} inline-flex`}>
          <input
            type="checkbox"
            className={CHECKBOX_INPUT_CLASS}
            checked={value.facturado_entidade}
            onChange={(e) => onChange({ facturado_entidade: e.target.checked })}
            disabled={disabled}
          />
          <span>Facturado à entidade</span>
        </label>
        <label className={`${FORM.checkboxRow} inline-flex`}>
          <input
            type="checkbox"
            className={CHECKBOX_INPUT_CLASS}
            checked={value.repeticao}
            onChange={(e) => onChange({ repeticao: e.target.checked })}
            disabled={disabled}
          />
          <span>Repetição</span>
        </label>
        <label className={`${FORM.checkboxRow} inline-flex`}>
          <input
            type="checkbox"
            className={CHECKBOX_INPUT_CLASS}
            checked={value.nao_notificar}
            onChange={(e) => onChange({ nao_notificar: e.target.checked })}
            disabled={disabled}
          />
          <span>Não notificar</span>
        </label>
      </div>
    </div>
  );
}
