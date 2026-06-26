import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Baby, FlaskConical, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SubTeste } from '../data/types';
import { findSubTeste, findTestePrincipal } from '../../lib/testes';
import { FORM_INPUT_CLASS } from '../../lib/design-system';

const inputClass = FORM_INPUT_CLASS;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

const emptySubTeste = (): Omit<SubTeste, 'id' | 'teste_pai_id'> => ({
  nome: '',
  descricao: '',
  preco: 0,
  codigo: '',
  preco_compra: 0,
  preco_venda: 0,
  cromossomas: [],
  delecoes_duplicacoes: false,
  microdelecoes_microduplicacoes: false,
  gemeos: false,
  determinacao_sexo_fetal: false,
  incluir_fracao_fetal: true,
});

const MATERNITY_PANEL_CLASS =
  'rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4';

const MATERNITY_OPTIONS: {
  key: keyof Pick<
    SubTeste,
    'gemeos' | 'determinacao_sexo_fetal' | 'delecoes_duplicacoes' | 'microdelecoes_microduplicacoes' | 'incluir_fracao_fetal'
  >;
  label: string;
}[] = [
  { key: 'gemeos', label: 'Permite gémeos' },
  { key: 'determinacao_sexo_fetal', label: 'Determinação do sexo fetal' },
  { key: 'delecoes_duplicacoes', label: 'Deleções / Duplicações' },
  { key: 'microdelecoes_microduplicacoes', label: 'Microdeleções / Microduplicações' },
  { key: 'incluir_fracao_fetal', label: 'Incluir fração fetal (0–100%)' },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={{ fontSize: '13px', fontWeight: 500 }}>
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

function MaternityOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
        checked
          ? 'border-teal-300 bg-teal-50/80 dark:border-teal-700 dark:bg-teal-950/30'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-gray-500'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-[13px] leading-snug text-gray-700 dark:text-gray-200">{label}</span>
    </label>
  );
}

export function SubTesteFormPage() {
  const { parentId, subId } = useParams();
  const navigate = useNavigate();
  const { testes, addSubTeste, updateSubTeste, refreshTestes } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');

  const editing = Boolean(subId);
  const parent = useMemo(() => (parentId ? findTestePrincipal(testes, parentId) : undefined), [testes, parentId]);
  const existingMatch = useMemo(
    () => (subId ? findSubTeste(testes, subId) : undefined),
    [testes, subId],
  );

  const [form, setForm] = useState<Omit<SubTeste, 'id' | 'teste_pai_id'>>(emptySubTeste);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const voltar = () => navigate(`/definicoes/testes/${parentId}/editar?tab=sub_testes`);
  const podeGuardar = editing ? canUpdate : canCreate;

  useEffect(() => {
    void refreshTestes().finally(() => setLoading(false));
  }, [refreshTestes]);

  useEffect(() => {
    if (loading) return;
    if (!parentId || !parent) {
      toast.error('Teste pai não encontrado.');
      navigate('/definicoes?tab=testes');
      return;
    }
    if (editing && subId) {
      if (existingMatch?.sub) {
        setForm({
          nome: existingMatch.sub.nome,
          descricao: existingMatch.sub.descricao,
          preco: existingMatch.sub.preco,
          codigo: existingMatch.sub.codigo,
          preco_compra: existingMatch.sub.preco_compra ?? 0,
          preco_venda: existingMatch.sub.preco_venda ?? 0,
          cromossomas: existingMatch.sub.cromossomas ?? [],
          delecoes_duplicacoes: !!existingMatch.sub.delecoes_duplicacoes,
          microdelecoes_microduplicacoes: !!existingMatch.sub.microdelecoes_microduplicacoes,
          gemeos: !!existingMatch.sub.gemeos,
          determinacao_sexo_fetal: !!existingMatch.sub.determinacao_sexo_fetal,
          incluir_fracao_fetal: existingMatch.sub.incluir_fracao_fetal ?? true,
        });
      } else {
        toast.error('Sub-teste não encontrado.');
        voltar();
      }
    }
  }, [loading, parentId, parent, editing, subId, existingMatch, navigate]);

  const toggleCromossoma = (n: number) => {
    setForm((f) => {
      const set = new Set(f.cromossomas ?? []);
      if (set.has(n)) set.delete(n);
      else set.add(n);
      return { ...f, cromossomas: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const setAllCromossomas = (selected: boolean) => {
    setForm((f) => ({
      ...f,
      cromossomas: selected ? Array.from({ length: 23 }, (_, i) => i + 1) : [],
    }));
  };

  const cromossomasCount = form.cromossomas?.length ?? 0;

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!podeGuardar || !parentId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        preco: form.preco_venda ?? form.preco,
      };
      if (editing && subId) {
        await updateSubTeste(subId, payload);
        toast.success('Sub-teste atualizado.');
      } else {
        await addSubTeste(parentId, payload);
        toast.success('Sub-teste criado.');
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar sub-teste.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !parent) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar sub-teste…
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
              {editing ? 'Editar sub-teste' : 'Novo sub-teste'}
            </h1>
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
              {parent.nome} · {form.nome || form.codigo || 'Variante do teste'}
            </p>
          </div>
          {podeGuardar && (
            <button
              type="submit"
              form="sub-teste-form"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Gravar' : 'Criar'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <form id="sub-teste-form" onSubmit={(e) => void handleSave(e)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 space-y-5 max-w-5xl">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Código" required>
                <input required type="text" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} className={inputClass} placeholder="MT-21-PC" style={{ fontSize: '14px', fontFamily: 'monospace' }} />
              </Field>
              <Field label="Nome do sub-teste" required>
                <input required type="text" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Maternity 21 Plus Core" style={{ fontSize: '14px' }} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Preço de compra (€)">
                <input type="number" step="0.01" value={form.preco_compra} onChange={(e) => setForm((f) => ({ ...f, preco_compra: parseFloat(e.target.value) || 0 }))} className={inputClass} style={{ fontSize: '14px' }} />
              </Field>
              <Field label="Preço de venda (€)">
                <input
                  type="number"
                  step="0.01"
                  value={form.preco_venda}
                  onChange={(e) => setForm((f) => ({ ...f, preco_venda: parseFloat(e.target.value) || 0, preco: parseFloat(e.target.value) || f.preco }))}
                  className={inputClass}
                  style={{ fontSize: '14px' }}
                />
              </Field>
            </div>

            <Field label="Descrição">
              <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className={inputClass} style={{ fontSize: '14px', resize: 'vertical' }} />
            </Field>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Baby className="w-4 h-4 text-teal-600" />
              <h2 className="text-[14px] font-semibold text-gray-800 dark:text-gray-100">Parâmetros {parent.nome}</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,22rem)_1fr] gap-4">
              <section className={MATERNITY_PANEL_CLASS}>
                <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Opções do sub-teste</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                  Parâmetros clínicos e de análise incluídos neste sub-teste.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {MATERNITY_OPTIONS.map(({ key, label }) => (
                    <MaternityOption
                      key={key}
                      label={label}
                      checked={!!form[key]}
                      onChange={(checked) => setForm((f) => ({ ...f, [key]: checked }))}
                    />
                  ))}
                </div>
              </section>

              <section className={MATERNITY_PANEL_CLASS}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Cromossomas (1–23)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {cromossomasCount === 0
                        ? 'Nenhum selecionado'
                        : `${cromossomasCount} de 23 selecionado${cromossomasCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setAllCromossomas(true)} className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      Todos
                    </button>
                    <button type="button" onClick={() => setAllCromossomas(false)} className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1.5">
                  {Array.from({ length: 23 }, (_, i) => i + 1).map((n) => {
                    const sel = (form.cromossomas ?? []).includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleCromossoma(n)}
                        className={`h-9 rounded-md text-xs font-semibold border transition-colors ${
                          sel
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={voltar} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50" style={{ fontSize: '13px' }}>
              Voltar
            </button>
            {podeGuardar && (
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60" style={{ fontSize: '13px', fontWeight: 600 }}>
                {saving ? 'A guardar…' : editing ? 'Gravar' : 'Criar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
