import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Baby, Check, FlaskConical, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SubTeste } from '../data/types';
import { findSubTeste, findTestePrincipal } from '../../lib/testes';
import { FORM_INPUT_CLASS, SECONDARY_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { CONTROL } from '../../lib/design-tokens';
import { FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton } from './shared/FormPageChrome';

const inputClass = FORM_INPUT_CLASS;
const labelClass = 'block mb-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-400';

/** Toggle teal — mesmo padrão visual da matriz de permissões (Administração). */
const tealToggleBase =
  'inline-flex items-center justify-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40';

function tealToggleClass(checked: boolean, interactive = true) {
  return [
    tealToggleBase,
    checked
      ? 'border-teal-300 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
      : 'border-slate-200 bg-white text-teal-600 dark:border-slate-700 dark:bg-slate-900',
    interactive && (checked
      ? 'hover:border-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-950/70 cursor-pointer'
      : 'hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'),
  ].join(' ');
}

const MATERNITY_SECTION_CLASS =
  'rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm';

const MATERNITY_INNER_PANEL =
  'rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4 md:p-5';

const MATERNITY_ICON_BOX =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800';

const smallSecondaryBtn = `${SECONDARY_ACTION_BUTTON_CLASS} px-2.5 py-1 text-xs font-medium`;

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
      <label className={labelClass}>
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

function CromossomaToggle({
  n,
  selected,
  onToggle,
}: {
  n: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Cromossoma ${n}`}
      onClick={onToggle}
      className={[
        tealToggleClass(selected),
        'h-9 min-w-[2.25rem] text-xs font-semibold tabular-nums',
        selected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400',
      ].join(' ')}
    >
      {n}
    </button>
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
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        checked
          ? 'border-teal-200 bg-teal-50/40 dark:border-teal-800 dark:bg-teal-950/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`${tealToggleClass(checked)} h-9 w-9 shrink-0`}
      >
        <Check
          className={`w-4 h-4 transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
          strokeWidth={2.5}
        />
      </button>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex-1 text-left text-[13px] leading-snug text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100"
      >
        {label}
      </button>
    </div>
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
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={voltar}
          title={editing ? 'Editar sub-teste' : 'Novo sub-teste'}
          subtitle={`${parent.nome} · ${form.nome || form.codigo || 'Variante do teste'}`}
          avatar={(
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
          )}
          actions={podeGuardar ? (
            <FormPrimaryButton type="submit" form="sub-teste-form" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Gravar' : 'Criar'}
            </FormPrimaryButton>
          ) : undefined}
        />

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

          <section className={MATERNITY_SECTION_CLASS}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <span className={MATERNITY_ICON_BOX}>
                <Baby className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                  Parâmetros {parent.nome}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configuração clínica e cobertura cromossómica deste sub-teste.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,22rem)_1fr] gap-4 p-5">
              <div className={MATERNITY_INNER_PANEL}>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Opções do sub-teste</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
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
              </div>

              <div className={MATERNITY_INNER_PANEL}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Cromossomas (1–23)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {cromossomasCount === 0
                        ? 'Nenhum selecionado'
                        : `${cromossomasCount} de 23 selecionado${cromossomasCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setAllCromossomas(true)} className={smallSecondaryBtn}>
                      Todos
                    </button>
                    <button type="button" onClick={() => setAllCromossomas(false)} className={smallSecondaryBtn}>
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1.5">
                  {Array.from({ length: 23 }, (_, i) => i + 1).map((n) => {
                    const sel = (form.cromossomas ?? []).includes(n);
                    return (
                      <CromossomaToggle
                        key={n}
                        n={n}
                        selected={sel}
                        onToggle={() => toggleCromossoma(n)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Legenda</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50">
                  <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
                </span>
                Opção activa
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                Inactivo
              </span>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={voltar} className={CONTROL.buttonSecondary}>
              Voltar
            </button>
            {podeGuardar && (
              <FormPrimaryButton type="submit" disabled={saving}>
                {saving ? 'A guardar…' : editing ? 'Gravar' : 'Criar'}
              </FormPrimaryButton>
            )}
          </div>
        </form>
      </FormPageBody>
    </FormPageShell>
  );
}
