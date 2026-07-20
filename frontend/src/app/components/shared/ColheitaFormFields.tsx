import { MapPin } from 'lucide-react';
import { Posto } from '../../data/types';
import { ColheitaFormState, PERIODO_COLHEITA_OPTIONS } from '../../../lib/colheita';
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
