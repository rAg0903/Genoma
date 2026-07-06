import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { X, ScanLine, Trash2, CheckCircle2, AlertTriangle, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Kit, Lote, RequisicaoKit, TipoKit } from '../../data/types';
import { useData } from '../../context/DataContext';
import { CONTROL, FORM } from '../../../lib/design-tokens';
import { AppModal, ModalActions, MODAL_INPUT_CLASS } from '../shared/AppModal';
import {
  buildShipmentLocationOptions,
  buildStockLocationOptions,
  buildDistributionLocationOptions,
  encodeLocationRef,
  encodeRequisicaoLocationRef,
  filterShipmentLocationOptions,
  flattenDistributionLocationOptions,
  formatRequisicaoLocationLabel,
  kitMatchesLocationRefForDistribuicao,
  locationRefToApiPayload,
  ShipmentLocationOptions,
  StockLocationRef,
} from '../../../lib/stock-locations';
import { aggregateKitTracking } from '../../../lib/stocks';
import { todayLocal, normalizeCalendarDate } from '../../../lib/dates';
import { MinDatePicker } from '../shared/MinDatePicker';

const today = () => new Date().toISOString().split('T')[0];

function KitListRow({ kit }: { kit: Kit }) {
  return (
    <span className="flex flex-col gap-0.5 min-w-0">
      <span className="truncate">{kit.codigo_barras}</span>
      {kit.tracking?.trim() ? (
        <span className="text-[10px] text-slate-400 truncate">Tracking: {kit.tracking}</span>
      ) : (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">Sem tracking registado</span>
      )}
    </span>
  );
}

const input = MODAL_INPUT_CLASS;
const label = FORM.label;

type TipoKitOption = { id: string; label: string; nome: string };

const buildTiposKitOptions = (tiposKit: TipoKit[]): TipoKitOption[] =>
  tiposKit.filter((t) => t.ativo !== false).map((t) => ({ id: t.id, nome: t.nome, label: t.nome }));

function DistributionLocationSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ShipmentLocationOptions;
  placeholder: string;
}) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.empresas.length > 0 && (
        <optgroup label="Empresas">
          {options.empresas.map((o) => (
            <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>
          ))}
        </optgroup>
      )}
      {options.laboratorioGroups.map(({ laboratorio, postos }) => (
        postos.length > 0 ? (
          <optgroup key={laboratorio.id} label={`Postos · ${laboratorio.nome}`}>
            {postos.map((p) => (
              <option key={encodeLocationRef(p)} value={encodeLocationRef(p)}>
                {p.nome}
              </option>
            ))}
          </optgroup>
        ) : null
      ))}
      {options.postosSemLaboratorio.length > 0 && (
        <optgroup label="Postos sem laboratório">
          {options.postosSemLaboratorio.map((o) => (
            <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function ShipmentLocationSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ShipmentLocationOptions;
  placeholder: string;
}) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.empresas.length > 0 && (
        <optgroup label="Empresas">
          {options.empresas.map((o) => (
            <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>
          ))}
        </optgroup>
      )}
      {options.laboratorioGroups.map(({ laboratorio, postos }) => (
        <optgroup key={laboratorio.id} label={`Laboratório: ${laboratorio.nome}`}>
          {postos.map((p) => (
            <option key={encodeLocationRef(p)} value={encodeLocationRef(p)}>
              {p.nome}
            </option>
          ))}
          {postos.length === 0 && (
            <option value="" disabled>
              Sem postos associados
            </option>
          )}
        </optgroup>
      ))}
      {options.postosSemLaboratorio.length > 0 && (
        <optgroup label="Postos sem laboratório">
          {options.postosSemLaboratorio.map((o) => (
            <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function StockLocationSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: StockLocationRef[];
  placeholder: string;
}) {
  const empresas = options.filter((o) => o.kind === 'empresa');
  const postos = options.filter((o) => o.kind === 'posto');
  const laboratorios = options.filter((o) => o.kind === 'laboratorio');

  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {empresas.length > 0 && (
        <optgroup label="Empresas">
          {empresas.map((o) => <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>)}
        </optgroup>
      )}
      {postos.length > 0 && (
        <optgroup label="Postos">
          {postos.map((o) => <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>)}
        </optgroup>
      )}
      {laboratorios.length > 0 && (
        <optgroup label="Laboratórios">
          {laboratorios.map((o) => <option key={encodeLocationRef(o)} value={encodeLocationRef(o)}>{o.nome}</option>)}
        </optgroup>
      )}
    </select>
  );
}

const findTipoKitByNome = (tiposKit: TipoKit[], value: string) => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  return tiposKit.find((t) => t.nome === normalized);
};

function TipoKitSelect({
  options,
  value,
  onChange,
  emptyMessage,
}: {
  options: TipoKitOption[];
  value: string;
  onChange: (id: string) => void;
  emptyMessage: string;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-slate-400 mt-1">{emptyMessage}</p>;
  }
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Selecione um tipo de kit...</option>
      {options.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}
// Apenas os estados efetivamente utilizados nos kits.
const KIT_STATUSES: Kit['status'][] = ['Disponível', 'Utilizado', 'Expirado'];
const LOCS: Kit['localizacao'][] = ['Escritorio', 'Posto', 'Laboratorio'];
export const LOC_LABELS: Record<Kit['localizacao'], string> = {
  Escritorio: 'Empresa/Escritório (Armazém)',
  Posto: 'Posto',
  Laboratorio: 'Laboratório',
};

function ModalShell({ title, onClose, children, onSubmit, submitLabel = 'Guardar', wide = false }: {
  title: string; onClose: () => void; children: ReactNode; onSubmit: () => void; submitLabel?: string; wide?: boolean;
}) {
  return (
    <AppModal
      title={title}
      onClose={onClose}
      wide={wide}
      footer={(
        <ModalActions onCancel={onClose} onSubmit={onSubmit} submitLabel={submitLabel} />
      )}
    >
      <div className={FORM.stack}>{children}</div>
    </AppModal>
  );
}

export function KitFormModal({ kit, onClose, onSave }: { kit: Kit | null; onClose: () => void; onSave: (data: Omit<Kit, 'id'>) => void }) {
  const { tiposKit: tiposKitList } = useData();
  const tiposKit = useMemo(() => buildTiposKitOptions(tiposKitList), [tiposKitList]);
  const [tipoKitId, setTipoKitId] = useState('');
  const [f, setF] = useState<Omit<Kit, 'id'>>({ codigo_barras: '', tracking: '', tipo_kit: '', lote: '', status: 'Disponível', data_validade: '', localizacao: 'Escritorio' });

  useEffect(() => {
    if (kit) {
      const { id, ...rest } = kit;
      void id;
      setF({ tracking: '', ...rest });
      setTipoKitId(findTipoKitByNome(tiposKitList, rest.tipo_kit)?.id ?? '');
      return;
    }
    setF({ codigo_barras: '', tracking: '', tipo_kit: '', lote: '', status: 'Disponível', data_validade: '', localizacao: 'Escritorio' });
    setTipoKitId(tiposKit[0]?.id ?? '');
  }, [kit, tiposKitList, tiposKit]);

  const handleSave = () => {
    const tipoKit = tiposKitList.find((t) => t.id === tipoKitId);
    if (!tipoKit) return;
    onSave({ ...f, tipo_kit: tipoKit.nome });
  };

  return (
    <ModalShell title={kit ? 'Editar kit' : 'Novo kit'} onClose={onClose} onSubmit={handleSave}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Nº Kit (código de barras)</label><input className={input} value={f.codigo_barras} onChange={(e) => setF({ ...f, codigo_barras: e.target.value })} /></div>
        <div><label className={label}>Tracking #</label><input className={input} value={f.tracking || ''} onChange={(e) => setF({ ...f, tracking: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Tipo de kit</label>
          <TipoKitSelect
            options={tiposKit}
            value={tipoKitId}
            onChange={setTipoKitId}
            emptyMessage="Sem tipos de kit. Configure em Administração → Tipos de Kit."
          />
        </div>
        <div><label className={label}>Lote</label><input className={input} value={f.lote} onChange={(e) => setF({ ...f, lote: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Estado</label><select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Kit['status'] })}>{KIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className={label}>Localizacao</label><select className={input} value={f.localizacao} onChange={(e) => setF({ ...f, localizacao: e.target.value as Kit['localizacao'] })}>{LOCS.map((l) => <option key={l} value={l}>{LOC_LABELS[l]}</option>)}</select></div>
      </div>
      <div><label className={label}>Validade</label><input type="date" className={input} value={f.data_validade} onChange={(e) => setF({ ...f, data_validade: e.target.value })} /></div>
    </ModalShell>
  );
}

export function LoteFormModal({ lote, onClose, onSave }: { lote: Lote | null; onClose: () => void; onSave: (data: Omit<Lote, 'id'>) => void }) {
  const { empresas, tiposKit: tiposKitList } = useData();
  const tiposKit = useMemo(() => buildTiposKitOptions(tiposKitList), [tiposKitList]);
  const [tipoKitId, setTipoKitId] = useState('');
  const [f, setF] = useState<Omit<Lote, 'id'>>({ codigo: '', tipo_kit: '', tipo_teste: '', teste_id: '', teste_nome: '', fornecedor: '', quantidade_total: 0, quantidade_disponivel: 0, data_rececao: today(), data_validade: '' });

  useEffect(() => {
    if (lote) {
      const { id, ...rest } = lote;
      void id;
      setF(rest);
      setTipoKitId(findTipoKitByNome(tiposKitList, rest.tipo_kit)?.id ?? '');
      return;
    }
    setF({ codigo: '', tipo_kit: '', tipo_teste: '', teste_id: '', teste_nome: '', fornecedor: '', quantidade_total: 0, quantidade_disponivel: 0, data_rececao: today(), data_validade: '' });
    setTipoKitId('');
  }, [lote, tiposKitList]);

  const handleSave = () => {
    const tipoKit = tiposKitList.find((t) => t.id === tipoKitId);
    if (!tipoKit) {
      toast.error('Selecione um tipo de kit.');
      return;
    }
    onSave({
      ...f,
      tipo_kit: tipoKit.nome,
      tipo_kit_id: tipoKit.id,
      teste_id: '',
      teste_nome: '',
      tipo_teste: '',
      data_rececao: f.data_rececao || today(),
    });
  };

  return (
    <ModalShell title={lote ? 'Editar lote' : 'Novo lote'} onClose={onClose} onSubmit={handleSave}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Codigo</label><input className={input} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} /></div>
        <div>
          <label className={label}>Tipo de kit</label>
          <TipoKitSelect
            options={tiposKit}
            value={tipoKitId}
            onChange={setTipoKitId}
            emptyMessage="Sem tipos de kit. Configure em Administração → Tipos de Kit."
          />
        </div>
      </div>
      <div>
        <label className={label}>Empresa</label>
        <select className={input} value={f.fornecedor} onChange={(e) => setF({ ...f, fornecedor: e.target.value })}>
          <option value="">Selecione uma empresa...</option>
          {empresas.map((e) => <option key={e.id} value={e.nome}>{e.nome}</option>)}
        </select>
        {empresas.length === 0 && <p className="text-xs text-slate-400 mt-1">Sem empresas criadas. Adicione em Administração → Empresas.</p>}
      </div>
      <div><label className={label}>Validade</label><input type="date" className={input} value={f.data_validade} onChange={(e) => setF({ ...f, data_validade: e.target.value })} /></div>
      <p className="text-xs text-slate-400">A data de receção é registada automaticamente com a data de criação. Os kits são inseridos individualmente, respeitando a numeração fornecida pelo fornecedor (não são gerados nem sequenciais). O teste concreto é escolhido na colheita — o lote agrupa kits do mesmo tipo.</p>
    </ModalShell>
  );
}

function KitTransferList({
  available,
  selected,
  onChange,
}: {
  available: Kit[];
  selected: Kit[];
  onChange: (selected: Kit[]) => void;
}) {
  const [pickedAvailable, setPickedAvailable] = useState<string[]>([]);
  const [pickedSelected, setPickedSelected] = useState<string[]>([]);

  const addToSelected = (ids: string[]) => {
    if (ids.length === 0) return;
    const moving = available.filter((k) => ids.includes(k.id));
    onChange([...selected, ...moving].sort((a, b) => a.codigo_barras.localeCompare(b.codigo_barras)));
    setPickedAvailable([]);
    setPickedSelected([]);
  };

  const removeFromSelected = (ids: string[]) => {
    if (ids.length === 0) return;
    onChange(selected.filter((k) => !ids.includes(k.id)));
    setPickedAvailable([]);
    setPickedSelected([]);
  };

  const togglePick = (list: 'available' | 'selected', id: string) => {
    const setter = list === 'available' ? setPickedAvailable : setPickedSelected;
    setter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const listClass = 'w-full min-h-[180px] max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono';

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
      <div>
        <p className={`${label} mb-1`}>Origem ({available.length})</p>
        <div className={listClass}>
          {available.length === 0 ? (
            <p className="px-3 py-6 text-xs text-slate-400 text-center">Sem kits disponíveis na origem</p>
          ) : available.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => togglePick('available', k.id)}
              onDoubleClick={() => addToSelected([k.id])}
              className={`block w-full text-left px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 ${pickedAvailable.includes(k.id) ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <KitListRow kit={k} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={() => addToSelected(pickedAvailable)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Adicionar selecionados"><ChevronRight className="w-4 h-4" /></button>
        <button type="button" onClick={() => addToSelected(available.map((k) => k.id))} disabled={available.length === 0} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40" title="Adicionar todos"><ChevronsRight className="w-4 h-4" /></button>
        <button type="button" onClick={() => removeFromSelected(pickedSelected)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Remover selecionados"><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => removeFromSelected(selected.map((k) => k.id))} disabled={selected.length === 0} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40" title="Remover todos"><ChevronsLeft className="w-4 h-4" /></button>
      </div>

      <div>
        <p className={`${label} mb-1`}>A enviar ({selected.length})</p>
        <div className={listClass}>
          {selected.length === 0 ? (
            <p className="px-3 py-6 text-xs text-slate-400 text-center">Selecione os kits a enviar</p>
          ) : selected.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => togglePick('selected', k.id)}
              onDoubleClick={() => removeFromSelected([k.id])}
              className={`block w-full text-left px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 ${pickedSelected.includes(k.id) ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <KitListRow kit={k} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RequisicaoFormModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<RequisicaoKit, 'id'>) => void }) {
  const { kits, empresas, postos, laboratorios } = useData();
  const shipmentLocations = useMemo(
    () => buildDistributionLocationOptions(empresas, postos, laboratorios),
    [empresas, postos, laboratorios],
  );
  const locationOptions = useMemo(
    () => flattenDistributionLocationOptions(shipmentLocations),
    [shipmentLocations],
  );
  const [origemKey, setOrigemKey] = useState('');
  const [destinoKey, setDestinoKey] = useState('');
  const [f, setF] = useState<Omit<RequisicaoKit, 'id'>>({
    data: todayLocal(),
    origem: 'Escritorio',
    destino: 'Posto',
    quantidade: 0,
    status: 'Entregue',
    observacoes: '',
  });
  const [selectedKits, setSelectedKits] = useState<Kit[]>([]);

  const origemRef = useMemo(
    () => locationOptions.find((o) => encodeLocationRef(o) === origemKey),
    [locationOptions, origemKey],
  );
  const destinoRef = useMemo(
    () => locationOptions.find((o) => encodeLocationRef(o) === destinoKey),
    [locationOptions, destinoKey],
  );

  const kitsNaOrigem = useMemo(() => {
    if (!origemRef) return [];
    return kits
      .filter((k) => kitMatchesLocationRefForDistribuicao(k, origemRef))
      .sort((a, b) => a.codigo_barras.localeCompare(b.codigo_barras));
  }, [origemRef, kits]);

  const availableKits = useMemo(
    () => kitsNaOrigem.filter((k) => !selectedKits.some((s) => s.id === k.id)),
    [kitsNaOrigem, selectedKits],
  );

  useEffect(() => {
    setSelectedKits((prev) => prev.filter((k) => kitsNaOrigem.some((x) => x.id === k.id)));
  }, [kitsNaOrigem]);

  const destinoShipmentLocations = useMemo(
    () => filterShipmentLocationOptions(shipmentLocations, origemKey || undefined),
    [shipmentLocations, origemKey],
  );

  useEffect(() => {
    if (origemKey && destinoKey === origemKey) setDestinoKey('');
  }, [origemKey, destinoKey]);

  const handleSave = () => {
    if (!origemRef) {
      toast.error('Selecione a origem.');
      return;
    }
    if (!destinoRef) {
      toast.error('Selecione o destino.');
      return;
    }
    if (selectedKits.length === 0) {
      toast.error('Selecione pelo menos um kit para enviar.');
      return;
    }
    if (origemKey === destinoKey) {
      toast.error('Origem e destino devem ser diferentes.');
      return;
    }
    if (f.data < todayLocal()) {
      toast.error('A data do envio não pode ser anterior a hoje.');
      return;
    }
    const semTracking = selectedKits.filter((k) => !k.tracking?.trim());
    if (semTracking.length > 0) {
      toast.error(`${semTracking.length} kit(s) sem tracking. Registe o tracking ao adicionar kits.`);
      return;
    }
    onSave({
      ...f,
      ...locationRefToApiPayload(origemRef, 'origem'),
      ...locationRefToApiPayload(destinoRef, 'destino'),
      quantidade: selectedKits.length,
      kit_ids: selectedKits.map((k) => k.id),
      tracking_number: aggregateKitTracking(selectedKits),
      transportadora: undefined,
    });
  };

  const hasLocations = locationOptions.length > 0;

  return (
    <ModalShell title="Novo envio" wide onClose={onClose} onSubmit={handleSave} submitLabel={`Registar envio (${selectedKits.length})`}>
      <p className="text-xs text-slate-500">Distribuição de kits disponíveis entre empresa e postos (sem laboratório final). Os kits selecionados são movidos automaticamente para o destino.</p>
      <div>
        <label className={label}>Data</label>
        <MinDatePicker className={input} value={f.data} onChange={(data) => setF({ ...f, data })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Origem</label>
          {!hasLocations ? (
            <p className="text-xs text-slate-400 mt-1">Configure empresas, postos e laboratórios em Administração.</p>
          ) : (
            <DistributionLocationSelect
              value={origemKey}
              onChange={(value) => {
                setOrigemKey(value);
                setSelectedKits([]);
                if (destinoKey === value) setDestinoKey('');
              }}
              options={shipmentLocations}
              placeholder="Selecione a origem..."
            />
          )}
        </div>
        <div>
          <label className={label}>Destino</label>
          {!hasLocations ? (
            <p className="text-xs text-slate-400 mt-1">Configure empresas, postos e laboratórios em Administração.</p>
          ) : !origemKey ? (
            <p className="text-xs text-slate-400 mt-1">Selecione primeiro a origem.</p>
          ) : flattenDistributionLocationOptions(destinoShipmentLocations).length === 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Sem outros destinos disponíveis.</p>
          ) : (
            <DistributionLocationSelect
              value={destinoKey}
              onChange={setDestinoKey}
              options={destinoShipmentLocations}
              placeholder="Selecione o destino..."
            />
          )}
        </div>
      </div>

      {origemRef && (
        <div>
          <label className={label}>Kits</label>
          {kitsNaOrigem.length === 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Não existem kits disponíveis em {origemRef.nome}.
            </p>
          ) : (
            <>
              <KitTransferList available={availableKits} selected={selectedKits} onChange={setSelectedKits} />
              <p className="text-xs text-slate-400 mt-1.5">Clique para selecionar e use as setas para mover. Duplo clique move um kit de imediato.</p>
            </>
          )}
        </div>
      )}

      {selectedKits.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
          <p className={`${label} mb-2`}>Tracking (herdado dos kits)</p>
          <p className="text-sm font-mono text-slate-700 dark:text-slate-200">
            {aggregateKitTracking(selectedKits) || '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Preenchido automaticamente a partir do tracking de cada kit seleccionado.</p>
        </div>
      )}

      <div><label className={label}>Observacoes</label><textarea rows={2} className={input} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
    </ModalShell>
  );
}

export function RequisicaoEditModal({
  requisicao,
  onClose,
  onSave,
}: {
  requisicao: RequisicaoKit;
  onClose: () => void;
  onSave: (data: RequisicaoKit) => void;
}) {
  const { kits, empresas, postos, laboratorios } = useData();
  const distributionOptions = useMemo(
    () => flattenDistributionLocationOptions(buildDistributionLocationOptions(empresas, postos, laboratorios)),
    [empresas, postos, laboratorios],
  );

  const origemKey = useMemo(
    () => encodeRequisicaoLocationRef(requisicao.origem, {
      empresa_id: requisicao.origem_empresa_id,
      posto_id: requisicao.origem_posto_id,
      laboratorio_id: requisicao.origem_laboratorio_id,
      nome: requisicao.origem_nome,
    }),
    [requisicao],
  );

  const [destinoKey, setDestinoKey] = useState(() =>
    encodeRequisicaoLocationRef(requisicao.destino, {
      empresa_id: requisicao.destino_empresa_id,
      posto_id: requisicao.destino_posto_id,
      laboratorio_id: requisicao.destino_laboratorio_id,
      nome: requisicao.destino_nome,
    }),
  );
  const [data, setData] = useState(requisicao.data);
  const [observacoes, setObservacoes] = useState(requisicao.observacoes || '');

  const origemRef = useMemo(
    () => distributionOptions.find((o) => encodeLocationRef(o) === origemKey),
    [distributionOptions, origemKey],
  );
  const destinoRef = useMemo(
    () => distributionOptions.find((o) => encodeLocationRef(o) === destinoKey),
    [distributionOptions, destinoKey],
  );

  const shipmentKits = useMemo(() => {
    const ids = new Set(requisicao.kit_ids || []);
    if (ids.size > 0) {
      return kits.filter((k) => ids.has(k.id)).sort((a, b) => a.codigo_barras.localeCompare(b.codigo_barras));
    }
    return kits
      .filter((k) => k.lote === requisicao.lote_codigo && k.localizacao === requisicao.destino)
      .sort((a, b) => a.codigo_barras.localeCompare(b.codigo_barras))
      .slice(0, requisicao.quantidade);
  }, [kits, requisicao]);

  const destinoOptions = useMemo(
    () => distributionOptions.filter((o) => encodeLocationRef(o) !== origemKey),
    [distributionOptions, origemKey],
  );

  const handleSave = () => {
    if (!origemRef) {
      toast.error('Origem do envio inválida.');
      return;
    }
    if (!destinoRef) {
      toast.error('Selecione o destino.');
      return;
    }
    if (destinoKey === origemKey) {
      toast.error('Origem e destino devem ser diferentes.');
      return;
    }
    const originalData = normalizeCalendarDate(requisicao.data);
    if (data < todayLocal() && data !== originalData) {
      toast.error('A data do envio não pode ser anterior a hoje.');
      return;
    }
    onSave({
      ...requisicao,
      data,
      observacoes,
      quantidade: requisicao.quantidade,
      status: requisicao.status,
      tracking_number: requisicao.tracking_number,
      ...locationRefToApiPayload(origemRef, 'origem'),
      ...locationRefToApiPayload(destinoRef, 'destino'),
    });
  };

  return (
    <ModalShell title="Editar envio" wide onClose={onClose} onSubmit={handleSave} submitLabel="Guardar alterações">
      <p className="text-xs text-slate-500">
        Corrija o destino se os kits foram enviados para o local errado. Os kits serão movidos automaticamente no inventário.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Data</label>
          <MinDatePicker allowExistingPastDate className={input} value={data} onChange={setData} />
        </div>
        <div>
          <label className={label}>Lote</label>
          <input className={`${input} bg-slate-50 dark:bg-slate-800/60`} value={requisicao.lote_codigo || '—'} readOnly />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Origem</label>
          <div className={`${input} bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200`}>
            {formatRequisicaoLocationLabel(requisicao.origem, requisicao.origem_nome)}
          </div>
        </div>
        <div>
          <label className={label}>Destino</label>
          {destinoOptions.length === 0 ? (
            <p className="text-xs text-slate-400 mt-1">Sem destinos disponíveis.</p>
          ) : (
            <StockLocationSelect
              value={destinoKey}
              onChange={setDestinoKey}
              options={destinoOptions}
              placeholder="Selecione o destino..."
            />
          )}
        </div>
      </div>

      <div>
        <label className={label}>Kits do envio ({shipmentKits.length})</label>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {shipmentKits.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-400">Sem kits associados a este envio.</p>
          ) : (
            shipmentKits.map((k) => (
              <div key={k.id} className="px-3 py-2">
                <KitListRow kit={k} />
              </div>
            ))
          )}
        </div>
      </div>

      {requisicao.tracking_number && (
        <div>
          <label className={label}>Tracking</label>
          <p className="text-sm font-mono text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            {requisicao.tracking_number}
          </p>
        </div>
      )}

      <div>
        <label className={label}>Observacoes</label>
        <textarea rows={2} className={input} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </div>
    </ModalShell>
  );
}

interface ScannedKit {
  codigo_barras: string;
  tracking?: string;
  estado: 'ok' | 'duplicado';
  detalhe?: string;
}

export function BatchKitScanModal({
  lotes,
  onClose,
  onCheckDuplicado,
  onSave,
}: {
  lotes: Lote[];
  onClose: () => void;
  onCheckDuplicado: (codigo: string) => Promise<{ duplicado: boolean; numero_processo?: string | null; paciente_nome?: string | null }>;
  onSave: (kits: Omit<Kit, 'id'>[]) => void;
}) {
  const { tiposKit: tiposKitList } = useData();
  const tiposKit = useMemo(() => buildTiposKitOptions(tiposKitList), [tiposKitList]);
  const [tipoKitId, setTipoKitId] = useState('');
  const [lote, setLote] = useState('');
  const [localizacao, setLocalizacao] = useState<Kit['localizacao']>('Escritorio');
  const [validade, setValidade] = useState('');
  const [current, setCurrent] = useState('');
  const [currentTracking, setCurrentTracking] = useState('');
  const [scanned, setScanned] = useState<ScannedKit[]>([]);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!tipoKitId && tiposKit[0]?.id) setTipoKitId(tiposKit[0].id);
  }, [tiposKit, tipoKitId]);

  const addCurrent = async () => {
    const codigo = current.trim();
    const tracking = currentTracking.trim();
    if (!codigo || checking) return;
    if (scanned.some((s) => s.codigo_barras.toLowerCase() === codigo.toLowerCase())) {
      setScanned((prev) => prev.map((s) => s.codigo_barras.toLowerCase() === codigo.toLowerCase() ? { ...s, estado: 'duplicado', detalhe: 'Repetido nesta lista' } : s));
      setCurrent('');
      setCurrentTracking('');
      inputRef.current?.focus();
      return;
    }
    setChecking(true);
    try {
      const res = await onCheckDuplicado(codigo);
      let detalhe: string | undefined;
      if (res.duplicado) {
        detalhe = res.numero_processo
          ? `Processo ${res.numero_processo}${res.paciente_nome ? ` — ${res.paciente_nome}` : ''}`
          : (res.paciente_nome ? `Cliente: ${res.paciente_nome}` : 'Já existe na base de dados');
      }
      setScanned((prev) => [{ codigo_barras: codigo, tracking: tracking || undefined, estado: res.duplicado ? 'duplicado' : 'ok', detalhe }, ...prev]);
    } finally {
      setChecking(false);
      setCurrent('');
      setCurrentTracking('');
      inputRef.current?.focus();
    }
  };

  const remove = (codigo: string) => setScanned((prev) => prev.filter((s) => s.codigo_barras !== codigo));
  const validos = scanned.filter((s) => s.estado === 'ok');

  const handleSave = () => {
    const tipoKit = tiposKitList.find((t) => t.id === tipoKitId);
    if (!tipoKit) return;
    onSave(validos.map((s) => ({
      codigo_barras: s.codigo_barras,
      tracking: s.tracking || '',
      tipo_kit: tipoKit.nome,
      lote,
      status: 'Disponível',
      data_validade: validade,
      localizacao,
    })));
  };

  return (
    <ModalShell title="Adicionar kits em sequência" onClose={onClose} onSubmit={handleSave} submitLabel={`Guardar ${validos.length} kit(s)`}>
      <p className="text-xs text-slate-500">A numeração é fornecida pelo laboratório. Leia o código de barras (ou escreva) e prima Enter para adicionar. Os duplicados são detetados imediatamente.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Tipo de kit</label>
          <TipoKitSelect
            options={tiposKit}
            value={tipoKitId}
            onChange={setTipoKitId}
            emptyMessage="Sem tipos de kit. Configure em Administração → Tipos de Kit."
          />
        </div>
        <div><label className={label}>Lote</label><select className={input} value={lote} onChange={(e) => setLote(e.target.value)}><option value="">— Sem lote —</option>{lotes.map((l) => <option key={l.id} value={l.codigo}>{l.codigo}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Localização</label><select className={input} value={localizacao} onChange={(e) => setLocalizacao(e.target.value as Kit['localizacao'])}>{LOCS.map((l) => <option key={l} value={l}>{LOC_LABELS[l]}</option>)}</select></div>
        <div><label className={label}>Validade</label><input type="date" className={input} value={validade} onChange={(e) => setValidade(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Nº Kit (código de barras)</label>
          <div className="relative">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
            <input
              ref={inputRef}
              className={`${input} pl-9`}
              value={current}
              placeholder="Leitura do scanner + Enter"
              onChange={(e) => setCurrent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addCurrent(); } }}
            />
          </div>
        </div>
        <div>
          <label className={label}>Tracking # (opcional)</label>
          <input
            className={input}
            value={currentTracking}
            placeholder="Tracking + Enter"
            onChange={(e) => setCurrentTracking(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addCurrent(); } }}
          />
        </div>
      </div>
      {scanned.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
          {scanned.map((s) => (
            <div key={s.codigo_barras} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {s.estado === 'ok'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                <span className="font-mono text-slate-700 dark:text-slate-200 truncate">{s.codigo_barras}</span>
                {s.tracking && <span className="text-xs text-slate-400 truncate">· {s.tracking}</span>}
                {s.estado === 'duplicado' && <span className="text-xs text-rose-500 truncate">{s.detalhe || 'Kit repetido'}</span>}
              </div>
              <button onClick={() => remove(s.codigo_barras)} className="p-1 rounded text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-slate-500">{validos.length} válido(s), {scanned.length - validos.length} repetido(s).</div>
    </ModalShell>
  );
}

