import { CONTROL } from '../../../lib/design-tokens';
import { ListingDef, FilterField, ESTADO_OPTIONS, KIT_FASE_CICLO_OPTIONS } from './listingConfig';
import { useLanguage } from '../../../i18n/LanguageContext';

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

const TEXT_FIELDS: Partial<Record<FilterField, { key: keyof AdvancedFilterState; label: string }>> = {
  medico: { key: 'medico', label: 'Médico' },
  posto: { key: 'posto', label: 'Posto' },
  empresa: { key: 'empresa', label: 'Empresa' },
  teste: { key: 'teste', label: 'Teste' },
  tipo: { key: 'tipo', label: 'Tipo' },
  localizacao: { key: 'localizacao', label: 'Localização' },
  fornecedor: { key: 'fornecedor', label: 'Fornecedor' },
  especialidade: { key: 'especialidade', label: 'Especialidade' },
};

interface Props {
  def: ListingDef;
  value: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
}

export function AdvancedFilters({ def, value, onChange }: Props) {
  const { t } = useLanguage();
  const set = (key: keyof AdvancedFilterState, v: string) => {
    const next = { ...value };
    if (v.trim() === '') delete next[key];
    else next[key] = v;
    onChange(next);
  };

  const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block';

  return (
    <div className="space-y-3">
      {def.filters.includes('data') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>{t('listingsPage.filters.from')}</label>
            <input type="date" value={value.data_de ?? ''} onChange={(e) => set('data_de', e.target.value)} className={CONTROL.input} />
          </div>
          <div>
            <label className={labelCls}>{t('listingsPage.filters.to')}</label>
            <input type="date" value={value.data_ate ?? ''} onChange={(e) => set('data_ate', e.target.value)} className={CONTROL.input} />
          </div>
        </div>
      )}

      {def.filters.includes('estado') && (
        <div>
          <label className={labelCls}>Estado</label>
          <select value={value.estado ?? ''} onChange={(e) => set('estado', e.target.value)} className={CONTROL.input}>
            <option value="">Todos</option>
            {(ESTADO_OPTIONS[def.key] ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {def.filters.includes('fase_ciclo') && (
        <div>
          <label className={labelCls}>Fase ciclo</label>
          <select value={value.fase_ciclo ?? ''} onChange={(e) => set('fase_ciclo', e.target.value)} className={CONTROL.input}>
            <option value="">Todas</option>
            {KIT_FASE_CICLO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {def.filters.includes('pago') && (
        <div>
          <label className={labelCls}>Pago</label>
          <select value={value.pago ?? ''} onChange={(e) => set('pago', e.target.value)} className={CONTROL.input}>
            <option value="">Todos</option>
            <option value="Sim">Sim</option>
            <option value="Nao">Não</option>
          </select>
        </div>
      )}

      {def.filters.includes('validado') && (
        <div>
          <label className={labelCls}>Validado</label>
          <select value={value.validado ?? ''} onChange={(e) => set('validado', e.target.value)} className={CONTROL.input}>
            <option value="">Todos</option>
            <option value="Sim">Sim</option>
            <option value="Nao">Não</option>
          </select>
        </div>
      )}

      {def.filters.map((f) => {
        const text = TEXT_FIELDS[f];
        if (!text) return null;
        return (
          <div key={f}>
            <label className={labelCls}>{text.label}</label>
            <input
              type="text"
              value={value[text.key] ?? ''}
              onChange={(e) => set(text.key, e.target.value)}
              placeholder={`Filtrar por ${text.label.toLowerCase()}`}
              className={CONTROL.input}
            />
          </div>
        );
      })}
    </div>
  );
}
