import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Edit, FlaskConical, Layers, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Teste } from '../data/types';
import { filterLaboratoriosFinais } from '../../lib/stock-locations';
import { findTestePrincipal, getTestesPrincipais } from '../../lib/testes';
import { FORM_INPUT_CLASS } from '../../lib/design-system';

const inputClass = FORM_INPUT_CLASS;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

const emptyTeste = (): Omit<Teste, 'id'> => ({
  nome: '',
  descricao: '',
  preco: 0,
  codigo: '',
  preco_compra: 0,
  preco_venda: 0,
  tempo_resposta_dias: null,
  gestacao_minima_semanas: null,
  tipo_teste: '',
  empresa: '',
  tipo_kit: '',
  cromossomas: [],
  delecoes_duplicacoes: false,
  microdelecoes_microduplicacoes: false,
  gemeos: false,
  determinacao_sexo_fetal: false,
  incluir_fracao_fetal: true,
  laboratorio_final_id: null,
});

const testeToForm = (t: Teste): Omit<Teste, 'id'> => {
  const nomeTeste = t.nome || t.tipo_teste || '';
  return {
    nome: nomeTeste,
    descricao: t.descricao,
    preco: 0,
    codigo: t.codigo,
    preco_compra: 0,
    preco_venda: 0,
    tempo_resposta_dias: t.tempo_resposta_dias ?? null,
    gestacao_minima_semanas: t.gestacao_minima_semanas ?? null,
    tipo_teste: nomeTeste,
    empresa: t.empresa ?? '',
    tipo_kit: t.tipo_kit ?? '',
    cromossomas: [],
    delecoes_duplicacoes: false,
    microdelecoes_microduplicacoes: false,
    gemeos: false,
    determinacao_sexo_fetal: false,
    incluir_fracao_fetal: true,
    laboratorio_final_id: t.laboratorio_final_id ?? null,
  };
};

const buildTestePayload = (form: Omit<Teste, 'id'>): Omit<Teste, 'id'> => {
  const nomeTeste = form.nome.trim();
  return {
    ...form,
    nome: nomeTeste,
    tipo_teste: nomeTeste,
    preco: 0,
    preco_compra: 0,
    preco_venda: 0,
  };
};

type TabId = 'dados' | 'sub_testes';

const TABS: { id: TabId; label: string; icon: typeof FlaskConical }[] = [
  { id: 'dados', label: 'Dados', icon: FlaskConical },
  { id: 'sub_testes', label: 'Sub-testes', icon: Layers },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={{ fontSize: '13px', fontWeight: 500 }}>
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

export function TesteFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { testes, tiposKit, empresas, laboratorios, addTeste, updateTeste, deleteSubTeste, refreshTestes } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');
  const canDelete = hasPermission('definicoes', 'delete');

  const editing = Boolean(id);
  const [form, setForm] = useState<Omit<Teste, 'id'>>(emptyTeste);
  const [loading, setLoading] = useState(editing);
  const [catalogReady, setCatalogReady] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const initialTab = searchParams.get('tab') === 'sub_testes' ? 'sub_testes' : 'dados';
  const [tab, setTab] = useState<TabId>(initialTab);

  const parentTeste = useMemo(
    () => (id ? findTestePrincipal(testes, id) : undefined),
    [testes, id],
  );
  const subTestes = parentTeste?.sub_testes ?? [];

  const voltar = () => navigate('/definicoes?tab=testes');
  const podeGuardar = editing ? canUpdate : canCreate;

  const empresasAtivas = useMemo(
    () => [...empresas.filter((e) => e.ativo !== false)].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [empresas],
  );

  const empresaOrfa = form.empresa && !empresasAtivas.some((e) => e.nome === form.empresa) ? form.empresa : '';

  const laboratoriosFinais = useMemo(
    () => filterLaboratoriosFinais(laboratorios).sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [laboratorios],
  );

  useEffect(() => {
    if (!id) return;
    setCatalogReady(false);
    setLoading(true);
    void refreshTestes()
      .then(() => setCatalogReady(true))
      .catch(() => {
        toast.error('Não foi possível carregar o teste.');
        voltar();
      });
  }, [id, refreshTestes, navigate]);

  useEffect(() => {
    if (!id || !catalogReady) return;
    const existing = getTestesPrincipais(testes).find((t) => t.id === id);
    if (existing) {
      setForm(testeToForm(existing));
      setLoading(false);
      return;
    }
    setLoading(false);
    toast.error('Teste não encontrado.');
    voltar();
  }, [id, catalogReady, testes, navigate]);

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!podeGuardar) return;
    setSaving(true);
    try {
      const payload = buildTestePayload(form);
      if (editing && id) {
        await updateTeste(id, payload);
        toast.success('Teste atualizado.');
      } else {
        await addTeste(payload);
        toast.success('Teste criado.');
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar teste.');
    } finally {
      setSaving(false);
    }
  };

  const openNewSubTeste = () => navigate(`/definicoes/testes/${id}/sub-testes/novo`);
  const openEditSubTeste = (subId: string) => navigate(`/definicoes/testes/${id}/sub-testes/${subId}/editar`);

  const handleDeleteSubTeste = (subId: string, nome: string) => {
    if (!confirm(`Eliminar sub-teste ${nome}?`)) return;
    void deleteSubTeste(subId)
      .then(() => toast.success('Sub-teste eliminado.'))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao eliminar sub-teste.'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar teste…
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={voltar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>
              {editing ? 'Editar teste' : 'Novo teste'}
            </h1>
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
              {form.nome || form.codigo || 'Configuração do teste laboratorial'}
            </p>
          </div>
          {podeGuardar && tab === 'dados' && (
            <button
              type="submit"
              form="teste-form"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Gravar' : 'Criar'}
            </button>
          )}
        </div>

        {editing && (
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${active ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'dados' && (
          <form id="teste-form" onSubmit={(e) => void handleSave(e)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 space-y-5 max-w-5xl">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Código" required>
                  <input required type="text" name="teste-codigo" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} className={inputClass} placeholder="MT-001" style={{ fontSize: '14px', fontFamily: 'monospace' }} />
                </Field>
                <Field label="Nome do teste" required>
                  <input required type="text" name="teste-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Maternity" style={{ fontSize: '14px' }} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Empresa">
                  <select value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} className={inputClass} style={{ fontSize: '14px' }}>
                    <option value="">Selecione...</option>
                    {empresasAtivas.map((e) => (
                      <option key={e.id} value={e.nome}>{e.nome}</option>
                    ))}
                    {empresaOrfa && <option value={empresaOrfa}>{empresaOrfa}</option>}
                  </select>
                </Field>
                <Field label="Tipo de kit">
                  <select value={form.tipo_kit} onChange={(e) => setForm((f) => ({ ...f, tipo_kit: e.target.value }))} className={inputClass} style={{ fontSize: '14px' }}>
                    <option value="">Selecione...</option>
                    {tiposKit.filter((t) => t.ativo !== false).map((t) => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Laboratório final (descarte)" required>
                <select
                  required
                  value={form.laboratorio_final_id || ''}
                  onChange={(e) => setForm((f) => ({ ...f, laboratorio_final_id: e.target.value || null }))}
                  className={inputClass}
                  style={{ fontSize: '14px' }}
                >
                  <option value="">Selecione o laboratório de processamento...</option>
                  {laboratoriosFinais.map((l) => (
                    <option key={l.id} value={l.id}>{l.nome}{l.codigo ? ` (${l.codigo})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Destino dos kits utilizados/expirados deste teste. Os preços são definidos nos sub-testes.
                </p>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tempo de resposta (dias)">
                  <input type="number" value={form.tempo_resposta_dias ?? ''} onChange={(e) => setForm((f) => ({ ...f, tempo_resposta_dias: e.target.value === '' ? null : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="10" style={{ fontSize: '14px' }} />
                </Field>
                <Field label="Gestação mínima (semanas)">
                  <input type="number" value={form.gestacao_minima_semanas ?? ''} onChange={(e) => setForm((f) => ({ ...f, gestacao_minima_semanas: e.target.value === '' ? null : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="10" style={{ fontSize: '14px' }} />
                </Field>
              </div>

              <Field label="Descrição">
                <textarea name="teste-descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={3} className={inputClass} style={{ fontSize: '14px', resize: 'vertical' }} />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={voltar} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50" style={{ fontSize: '13px' }}>
                Voltar à lista
              </button>
              {podeGuardar && (
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {saving ? 'A guardar…' : editing ? 'Gravar' : 'Criar'}
                </button>
              )}
            </div>
          </form>
        )}

        {tab === 'sub_testes' && editing && id && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 max-w-5xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Sub-testes</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Variantes com preços e parâmetros Maternity. Estes são os testes selecionáveis na colheita.
                </p>
              </div>
              {canCreate && (
                <button type="button" onClick={openNewSubTeste} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-[13px] font-semibold">
                  <Plus className="w-4 h-4" /> Novo sub-teste
                </button>
              )}
            </div>

            {subTestes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sem sub-testes. Adicione variantes como Maternity 21 Plus Core, Genome, etc.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Código</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Nome</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Preço venda</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {subTestes.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-semibold">{st.codigo}</span></td>
                        <td className="px-4 py-3 text-[13px] font-medium text-gray-800 dark:text-gray-100">{st.nome}</td>
                        <td className="px-4 py-3 text-[14px] font-semibold">{(st.preco_venda ?? st.preco ?? 0).toFixed(2)} €</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {canUpdate && (
                              <button type="button" onClick={() => openEditSubTeste(st.id)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" title="Editar sub-teste">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" onClick={() => handleDeleteSubTeste(st.id, st.nome)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Eliminar sub-teste">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
