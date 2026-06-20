import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Edit, Search, PackageSearch, PackagePlus, ScanLine, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Lote, Kit } from '../../data/types';
import { EmptyState } from '../shared/EmptyState';
import { DetailDrawer } from '../shared/DetailDrawer';
import { StatusBadge } from '../shared/StatusBadge';
import { KIT_STATUS_STYLES } from '../../../lib/design-system';
import { validadeEstado, VALIDADE_STYLE, formatValidadeAte, isKitDisponivel } from '../../../lib/stocks';
import { useLanguage } from '../../../i18n/LanguageContext';

type DuplicadoResult = { duplicado: boolean; numero_processo?: string | null; paciente_nome?: string | null };

interface LotesTabProps {
  lotes: Lote[];
  kits: Kit[];
  canUpdate: boolean;
  canCreate: boolean;
  onEdit: (l: Lote) => void;
  onAddKits: (lote: Lote, novos: Omit<Kit, 'id'>[]) => Promise<void>;
  onCheckDuplicado: (codigo: string) => Promise<DuplicadoResult>;
}

interface PendingKit {
  codigo_barras: string;
  tracking?: string;
  estado: 'ok' | 'duplicado';
  detalhe?: string;
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';
const labelCls = 'text-xs font-medium text-slate-500 mb-1 block';

/** Painel de registo de kits (Nº Kit + Tracking #) por leitura de pistola ou manual. */
function KitRegistrationPanel({
  lote,
  existentes,
  onAddKits,
  onCheckDuplicado,
}: {
  lote: Lote;
  existentes: Kit[];
  onAddKits: (lote: Lote, novos: Omit<Kit, 'id'>[]) => Promise<void>;
  onCheckDuplicado: (codigo: string) => Promise<DuplicadoResult>;
}) {
  const [codigo, setCodigo] = useState('');
  const [tracking, setTracking] = useState('');
  const [pending, setPending] = useState<PendingKit[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const codigoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { codigoRef.current?.focus(); }, []);

  const jaExisteNoLote = (c: string) => existentes.some((k) => k.codigo_barras.toLowerCase() === c.toLowerCase());

  const addLinha = async () => {
    const c = codigo.trim();
    const t = tracking.trim();
    if (!c || checking) return;

    if (jaExisteNoLote(c) || pending.some((p) => p.codigo_barras.toLowerCase() === c.toLowerCase())) {
      setPending((prev) => {
        const existe = prev.some((p) => p.codigo_barras.toLowerCase() === c.toLowerCase());
        const dup: PendingKit = { codigo_barras: c, tracking: t || undefined, estado: 'duplicado', detalhe: 'Repetido' };
        return existe
          ? prev.map((p) => p.codigo_barras.toLowerCase() === c.toLowerCase() ? { ...p, estado: 'duplicado', detalhe: 'Repetido nesta lista' } : p)
          : [dup, ...prev];
      });
      setCodigo(''); setTracking(''); codigoRef.current?.focus();
      return;
    }

    setChecking(true);
    try {
      const res = await onCheckDuplicado(c);
      let detalhe: string | undefined;
      if (res.duplicado) {
        detalhe = res.numero_processo
          ? `Processo ${res.numero_processo}${res.paciente_nome ? ` — ${res.paciente_nome}` : ''}`
          : (res.paciente_nome ? `Cliente: ${res.paciente_nome}` : 'Já existe na base de dados');
      }
      setPending((prev) => [{ codigo_barras: c, tracking: t || undefined, estado: res.duplicado ? 'duplicado' : 'ok', detalhe }, ...prev]);
    } finally {
      setChecking(false);
      setCodigo(''); setTracking(''); codigoRef.current?.focus();
    }
  };

  const remove = (c: string) => setPending((prev) => prev.filter((p) => p.codigo_barras !== c));
  const validos = pending.filter((p) => p.estado === 'ok');

  const guardar = async () => {
    if (validos.length === 0 || saving) return;
    setSaving(true);
    try {
      await onAddKits(lote, validos.map((p) => ({
        codigo_barras: p.codigo_barras,
        tracking: p.tracking || '',
        tipo_kit: lote.tipo_kit,
        lote: lote.codigo,
        status: 'Disponível',
        data_validade: lote.data_validade,
        localizacao: 'Escritorio',
        empresa_id: lote.fornecedor_id,
      })));
      setPending([]);
      codigoRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <PackagePlus className="w-4 h-4 text-teal-600" /> Adicionar kits ao lote
      </div>
      <p className="text-xs text-slate-500">Leia o código de barras com a pistola (ou escreva) e prima Enter. A numeração é a fornecida pelo fornecedor — não é gerada nem sequencial.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nº Kit</label>
          <div className="relative">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
            <input
              ref={codigoRef}
              className={`${inputCls} pl-9`}
              value={codigo}
              placeholder="Leitura do scanner + Enter"
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addLinha(); } }}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tracking #</label>
          <input
            className={inputCls}
            value={tracking}
            placeholder="Tracking (opcional) + Enter"
            onChange={(e) => setTracking(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addLinha(); } }}
          />
        </div>
      </div>

      {pending.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <span>Nº Kit</span><span>Tracking #</span><span></span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
            {pending.map((p) => (
              <div key={p.codigo_barras} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {p.estado === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                  <span className="font-mono text-slate-700 dark:text-slate-200 truncate">{p.codigo_barras}</span>
                </div>
                <span className="font-mono text-xs text-slate-500 truncate">{p.tracking || '—'}</span>
                <div className="flex items-center gap-2 justify-end">
                  {p.estado === 'duplicado' && <span className="text-[11px] text-rose-500 truncate hidden sm:inline">{p.detalhe || 'Repetido'}</span>}
                  <button onClick={() => remove(p.codigo_barras)} className="p-1 rounded text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{validos.length} válido(s){pending.length - validos.length > 0 ? `, ${pending.length - validos.length} repetido(s)` : ''}</span>
        <button
          onClick={() => void guardar()}
          disabled={validos.length === 0 || saving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'A guardar…' : `Guardar ${validos.length} kit(s)`}
        </button>
      </div>
    </div>
  );
}

export function LotesTab({ lotes, kits, canUpdate, canCreate, onEdit, onAddKits, onCheckDuplicado }: LotesTabProps) {
  const { t, localeTag } = useLanguage();
  const [search, setSearch] = useState('');
  const [loteKits, setLoteKits] = useState<Lote | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return lotes.filter((l) => !q || [l.codigo, l.tipo_kit, l.fornecedor].some((f) => (f || '').toLowerCase().includes(q)));
  }, [lotes, search]);

  const kitsDoLote = loteKits ? kits.filter((k) => k.lote === loteKits.codigo) : [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('stocks.searchLotes')} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Boxes} title={t('stocks.emptyLotes.title')} description={t('stocks.emptyLotes.description')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('stocks.table.batch')}</th>
                  <th className="px-4 py-3">{t('stocks.table.type')}</th>
                  <th className="px-4 py-3">{t('stocks.table.supplier')}</th>
                  <th className="px-4 py-3">{t('stocks.table.kits')}</th>
                  <th className="px-4 py-3">{t('stocks.table.validity')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((l) => {
                  const doLote = kits.filter((k) => k.lote === l.codigo);
                  const total = doLote.length;
                  const disponiveis = doLote.filter(isKitDisponivel).length;
                  const ve = validadeEstado(l.data_validade);
                  const vazio = total === 0;
                  return (
                    <tr key={l.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-[13px] font-mono font-semibold text-slate-900 dark:text-slate-100">{l.codigo}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{l.tipo_kit}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{l.fornecedor || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {vazio ? <span className="text-slate-400">{t('stocks.noKits')}</span> : <span>{t('stocks.kitsCount', { available: disponiveis, total })}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${VALIDADE_STYLE[ve].cls}`}>
                          {formatValidadeAte(l.data_validade, {
                            validUntil: t('stocks.validity.validUntil'),
                            expired: t('stocks.validity.expired'),
                            localeTag,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {vazio && canCreate ? (
                            <button onClick={() => setLoteKits(l)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"><PackagePlus className="w-3.5 h-3.5" /> {t('stocks.addKits')}</button>
                          ) : (
                            <button onClick={() => setLoteKits(l)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><PackageSearch className="w-3.5 h-3.5" /> {t('stocks.viewKits')}</button>
                          )}
                          {canUpdate && <button onClick={() => onEdit(l)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailDrawer
        open={!!loteKits}
        onClose={() => setLoteKits(null)}
        width="lg"
        title={<span className="font-mono">{loteKits?.codigo}</span>}
        subtitle={`${kitsDoLote.length} kit(s) · ${loteKits?.tipo_kit ?? ''}`}
      >
        <div className="space-y-4">
          {loteKits && canCreate && (
            <KitRegistrationPanel
              lote={loteKits}
              existentes={kitsDoLote}
              onAddKits={onAddKits}
              onCheckDuplicado={onCheckDuplicado}
            />
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{t('stocks.kitsInBatch', { count: kitsDoLote.length })}</div>
            {kitsDoLote.length === 0 ? (
              <EmptyState icon={Boxes} title={t('stocks.emptyBatchKits.title')} description={t('stocks.emptyBatchKits.description')} />
            ) : (
              <div className="space-y-2">
                {kitsDoLote.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">{k.codigo_barras}</div>
                      <div className="text-[11px] text-slate-400 truncate">{k.tracking ? `Tracking ${k.tracking} · ` : ''}{k.localizacao}</div>
                    </div>
                    <StatusBadge status={k.status} map={KIT_STATUS_STYLES} className="px-2 py-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
