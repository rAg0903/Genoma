import { useEffect, useMemo, useState } from 'react';
import { CONTROL } from '../../../lib/design-tokens';
import { ListingDef, FilterField, ESTADO_OPTIONS, KIT_FASE_CICLO_OPTIONS } from './listingConfig';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useData } from '../../context/DataContext';
import { medicosApi } from '../../../lib/api-medicos';
import { FormRadixSelect } from '../shared/FormPageChrome';
import { MinDatePicker } from '../shared/MinDatePicker';

export type AdvancedFilterState = {
  estado?: string;
  data_de?: string;
  data_ate?: string;
  medico?: string;
  posto?: string;
  empresa?: string;
  teste?: string;
  pago?: string;
  validado?: string;
  tipo?: string;
  localizacao?: string;
  fornecedor?: string;
  especialidade?: string;
  fase_ciclo?: string;
};

export const countActiveFilters = (s: AdvancedFilterState): number =>
  Object.values(s).filter((v) => v !== undefined && String(v).trim() !== '').length;

const ALL_VALUE = '__all__';

const TEXT_FIELDS: Partial<Record<FilterField, keyof AdvancedFilterState>> = {
  localizacao: 'localizacao',
  fornecedor: 'fornecedor',
  especialidade: 'especialidade',
};

interface Props {
  def: ListingDef;
  value: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
}

export function AdvancedFilters({ def, value, onChange }: Props) {
  const { t } = useLanguage();
  const { empresas, postos, testes, tiposKit } = useData();
  const [medicos, setMedicos] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void medicosApi.list()
      .then((list) => {
        if (cancelled) return;
        setMedicos(
          list
            .filter((m) => m.nome?.trim())
            .map((m) => ({ value: m.nome, label: m.nome }))
            .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
        );
      })
      .catch(() => { if (!cancelled) setMedicos([]); });
    return () => { cancelled = true; };
  }, []);

  const set = (key: keyof AdvancedFilterState, v: string) => {
    const next = { ...value };
    if (v.trim() === '') delete next[key];
    else next[key] = v;
    onChange(next);
  };

  const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block';

  const empresaOptions = useMemo(
    () => empresas
      .filter((e) => e.nome?.trim() && e.ativo !== false)
      .map((e) => ({ value: e.nome, label: e.nome }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
    [empresas],
  );

  const postoOptions = useMemo(
    () => postos
      .filter((p) => p.nome?.trim())
      .map((p) => ({ value: p.nome, label: p.nome }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
    [postos],
  );

  const testeOptions = useMemo(
    () => testes
      .filter((t) => t.nome?.trim() && t.ativo !== false)
      .map((t) => ({ value: t.nome, label: t.codigo ? `${t.codigo} — ${t.nome}` : t.nome }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
    [testes],
  );

  const tipoKitOptions = useMemo(
    () => tiposKit
      .filter((t) => t.nome?.trim())
      .map((t) => ({ value: t.nome, label: t.nome }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
    [tiposKit],
  );

  const estadoOptions = (ESTADO_OPTIONS[def.key] ?? []).map((o) => ({ value: o, label: o }));

  const boolOptions = [
    { value: 'Sim', label: t('listingsPage.filters.yes') },
    { value: 'Nao', label: t('listingsPage.filters.no') },
  ];

  const faseOptions = KIT_FASE_CICLO_OPTIONS.map((o) => ({ value: o, label: o }));

  const selectOptions = (items: { value: string; label: string }[]) => [
    { value: ALL_VALUE, label: t('listingsPage.filters.all') },
    ...items,
  ];

  const renderSelect = (
    fieldKey: keyof AdvancedFilterState,
    labelKey: string,
    options: { value: string; label: string }[],
    placeholder?: string,
  ) => (
    <div>
      <label className={labelCls}>{t(labelKey)}</label>
      <FormRadixSelect
        value={value[fieldKey] || ALL_VALUE}
        onChange={(v) => set(fieldKey, v === ALL_VALUE ? '' : v)}
        placeholder={placeholder ?? t('listingsPage.filters.select')}
        options={selectOptions(options)}
      />
    </div>
  );

  const catalogSelectFields: Partial<Record<FilterField, {
    key: keyof AdvancedFilterState;
    labelKey: string;
    options: { value: string; label: string }[];
  }>> = {
    medico: { key: 'medico', labelKey: 'listingsPage.filters.medico', options: medicos },
    posto: { key: 'posto', labelKey: 'listingsPage.filters.posto', options: postoOptions },
    empresa: { key: 'empresa', labelKey: 'listingsPage.filters.empresa', options: empresaOptions },
    teste: { key: 'teste', labelKey: 'listingsPage.filters.teste', options: testeOptions },
    tipo: { key: 'tipo', labelKey: 'listingsPage.filters.tipo', options: tipoKitOptions },
  };

  return (
    <div className="space-y-3">
      {def.filters.includes('data') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>{t('listingsPage.filters.from')}</label>
            <MinDatePicker
              value={value.data_de ?? ''}
              onChange={(v) => set('data_de', v)}
              allowAnyDate
              placeholder={t('listingsPage.filters.datePlaceholder')}
            />
          </div>
          <div>
            <label className={labelCls}>{t('listingsPage.filters.to')}</label>
            <MinDatePicker
              value={value.data_ate ?? ''}
              onChange={(v) => set('data_ate', v)}
              allowAnyDate
              placeholder={t('listingsPage.filters.datePlaceholder')}
            />
          </div>
        </div>
      )}

      {def.filters.includes('estado') && estadoOptions.length > 0 && (
        renderSelect('estado', 'listingsPage.filters.estado', estadoOptions)
      )}

      {def.filters.includes('fase_ciclo') && (
        renderSelect('fase_ciclo', 'listingsPage.filters.faseCiclo', faseOptions)
      )}

      {def.filters.includes('pago') && (
        renderSelect('pago', 'listingsPage.filters.pago', boolOptions)
      )}

      {def.filters.includes('validado') && (
        renderSelect('validado', 'listingsPage.filters.validado', boolOptions)
      )}

      {def.filters.map((f) => {
        const catalog = catalogSelectFields[f];
        if (catalog) {
          return (
            <div key={f}>
              {renderSelect(catalog.key, catalog.labelKey, catalog.options)}
            </div>
          );
        }
        const textKey = TEXT_FIELDS[f];
        if (!textKey) return null;
        return (
          <div key={f}>
            <label className={labelCls}>{t(`listingsPage.filters.${textKey}`)}</label>
            <input
              type="text"
              value={value[textKey] ?? ''}
              onChange={(e) => set(textKey, e.target.value)}
              placeholder={t(`listingsPage.filters.placeholder.${textKey}`)}
              className={CONTROL.input}
            />
          </div>
        );
      })}
    </div>
  );
}
