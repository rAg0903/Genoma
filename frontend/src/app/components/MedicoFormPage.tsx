import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Save, User, Phone, MapPin, StickyNote, FileText, Receipt, Loader2, Plus, Trash2, ChevronRight, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DetailPanel, DetailSection, DetailDivider } from './ContactDetail';
import {
  FormAvatarInitials,
  FormField,
  FormInput,
  FormNumberInput,
  FormPageBody,
  FormPageHeader,
  FormPageShell,
  FormPrimaryButton,
  FormRadixSelect,
  FormTabContent,
  FormTextarea,
} from './shared/FormPageChrome';
import {
  MedicoCondicaoTesteInput,
  MedicoContactoSecundario,
  MedicoPayload,
  getMedicoSaveFeedback,
  medicosApi,
} from '../../lib/api-medicos';
import { Teste } from '../data/types';
import { getTestesSelecionaveis, getTestesSelecionaveisComLabel } from '../../lib/testes';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';

type TabId = 'identificacao' | 'condicoes' | 'relatorios' | 'notas';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'condicoes', label: 'Condições comerciais', icon: Receipt },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'notas', label: 'Notas', icon: StickyNote },
];

const emptyContacto = (): MedicoContactoSecundario => ({ nome: '', funcao: '', email: '', telefone: '' });

const emptyForm = (): MedicoPayload => ({
  nome: '',
  titulo: '',
  genero: 'Feminino',
  pais: 'Portugal',
  num_ordem: '',
  telefone_fixo: '',
  telefone_movel: '',
  email: '',
  criterio_busca_postos: 'nome',
  notas: '',
  ativo: true,
  especialidade: '',
  contactos_secundarios: [emptyContacto(), emptyContacto(), emptyContacto()],
  locais_trabalho: [],
  condicoes_testes: [],
});

const mergeCondicoesComCatalogo = (testes: Teste[], atuais: MedicoCondicaoTesteInput[]) => {
  const byId = new Map(atuais.map((c) => [c.teste_id, c]));
  return testes.map((t) => ({
    teste_id: t.id,
    comissao: byId.get(t.id)?.comissao ?? '',
    prazo_pagamento_dias: byId.get(t.id)?.prazo_pagamento_dias ?? '',
  }));
};

export function MedicoFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const fromUtilizadores = pathname.includes('/definicoes/utilizadores/');
  const listPath = fromUtilizadores ? '/definicoes?tab=utilizadores' : '/definicoes?tab=medicos';
  const { entidades, testes, refreshEntidades } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');

  const editing = Boolean(id);
  const [tab, setTab] = useState<TabId>('identificacao');
  const [form, setForm] = useState<MedicoPayload>(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const entidadesAtivas = useMemo(() => entidades.filter((e) => e.ativo !== false), [entidades]);
  const entidadeOptions = useMemo(
    () => entidadesAtivas.map((e) => ({
      value: e.id,
      label: `${e.nome}${e.cidade ? ` — ${e.cidade}` : ''}`,
    })),
    [entidadesAtivas],
  );
  const testesAtivos = useMemo(
    () => [...getTestesSelecionaveis(testes)].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [testes],
  );
  const testesPorId = useMemo(() => new Map(testesAtivos.map((t) => [t.id, t])), [testesAtivos]);
  const testesLabelPorId = useMemo(
    () => new Map(getTestesSelecionaveisComLabel(testes).map((t) => [t.id, t.label])),
    [testes],
  );

  useEffect(() => {
    void refreshEntidades();
  }, [refreshEntidades]);

  useEffect(() => {
    if (testesAtivos.length === 0) return;
    setForm((prev) => ({
      ...prev,
      condicoes_testes: mergeCondicoesComCatalogo(testesAtivos, prev.condicoes_testes),
    }));
  }, [testesAtivos]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    medicosApi.get(id)
      .then((m) => {
        if (!m) return;
        const contactos = [...(m.contactos_secundarios || [])];
        while (contactos.length < 3) contactos.push(emptyContacto());
        const savedCondicoes = (m.condicoes_testes || []).map((c) => ({
          teste_id: c.teste_id,
          comissao: c.comissao != null ? String(c.comissao) : '',
          prazo_pagamento_dias: c.prazo_pagamento_dias != null ? String(c.prazo_pagamento_dias) : '',
        }));
        setForm({
          nome: m.nome,
          titulo: m.titulo || '',
          genero: m.genero || 'Feminino',
          pais: m.pais || 'Portugal',
          num_ordem: m.num_ordem || '',
          telefone_fixo: m.telefone_fixo || '',
          telefone_movel: m.telefone_movel || '',
          email: m.email,
          criterio_busca_postos: m.criterio_busca_postos || 'nome',
          notas: m.notas || '',
          ativo: m.ativo !== false,
          especialidade: m.especialidade || '',
          contactos_secundarios: contactos.slice(0, 3),
          locais_trabalho: (m.locais_trabalho || []).map((l) => ({ entidade_id: l.entidade_id })),
          condicoes_testes: testesAtivos.length > 0
            ? mergeCondicoesComCatalogo(testesAtivos, savedCondicoes)
            : savedCondicoes,
        });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o médico.');
        navigate(listPath);
      })
      .finally(() => setLoading(false));
  }, [id, listPath, navigate, testesAtivos]);

  const displayName = [form.titulo, form.nome].filter(Boolean).join(' ').trim();
  const initials = (displayName || 'Novo Médico').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const podeGuardar = editing ? canUpdate : canCreate;

  const updateContacto = (index: number, patch: Partial<MedicoContactoSecundario>) => {
    setForm((prev) => {
      const next = [...prev.contactos_secundarios];
      next[index] = { ...next[index], ...patch };
      return { ...prev, contactos_secundarios: next };
    });
  };

  const addLocal = () => {
    const used = new Set(form.locais_trabalho.map((l) => l.entidade_id));
    const nextEntidade = entidadesAtivas.find((e) => !used.has(e.id));
    if (!nextEntidade) {
      toast.message('Todas as entidades disponíveis já foram adicionadas.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      locais_trabalho: [...prev.locais_trabalho, { entidade_id: nextEntidade.id }],
    }));
  };

  const updateLocal = (index: number, entidadeId: string) => {
    setForm((prev) => {
      const next = [...prev.locais_trabalho];
      next[index] = { entidade_id: entidadeId };
      return { ...prev, locais_trabalho: next };
    });
  };

  const updateCondicao = (testeId: string, patch: Partial<MedicoCondicaoTesteInput>) => {
    setForm((prev) => ({
      ...prev,
      condicoes_testes: prev.condicoes_testes.map((c) => (
        c.teste_id === testeId ? { ...c, ...patch } : c
      )),
    }));
  };

  const removeLocal = (index: number) => {
    setForm((prev) => ({
      ...prev,
      locais_trabalho: prev.locais_trabalho.filter((_, i) => i !== index),
    }));
  };

  const handleGuardar = async () => {
    if (!form.nome.trim()) { toast.error('Indique o nome do médico.'); return; }
    if (!form.email.trim()) { toast.error('Indique o email do médico.'); return; }

    setSaving(true);
    try {
      if (editing && id) {
        await medicosApi.update(id, form);
        toast.success('Médico atualizado.');
      } else {
        await medicosApi.create(form);
        toast.success('Médico criado.');
      }
      navigate(listPath);
    } catch (err) {
      const feedback = getMedicoSaveFeedback(err);
      if (feedback.kind === 'warning') toast.warning(feedback.message);
      else toast.error(feedback.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar médico…
      </div>
    );
  }

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={() => navigate(listPath)}
          title={displayName || (editing ? 'Editar médico' : 'Novo médico')}
          subtitle={editing ? 'Edição de médico' : 'Criação de médico'}
          avatar={<FormAvatarInitials initials={initials} />}
          actions={podeGuardar ? (
            <FormPrimaryButton onClick={() => void handleGuardar()} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
        />

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Identificação" icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label="Nome" required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Título" width="sm">
                    <FormInput
                      value={form.titulo || ''}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Dr., Dra., Prof."
                    />
                  </FormField>
                  <FormField label="Género" width="md">
                    <FormRadixSelect
                      value={form.genero || 'Feminino'}
                      onChange={(v) => setForm({ ...form, genero: v })}
                      options={[
                        { value: 'Feminino', label: 'Feminino' },
                        { value: 'Masculino', label: 'Masculino' },
                      ]}
                    />
                  </FormField>
                  <FormField label="Nº Cédula" width="md">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.num_ordem || ''}
                      onChange={(e) => setForm({ ...form, num_ordem: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Especialidade" width="xl">
                    <FormInput
                      value={form.especialidade || ''}
                      onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                      placeholder="Ex.: Obstetrícia, Medicina Materno-Fetal"
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Contactos" icon={Phone}>
                <div className={FORM.fieldRow}>
                  <FormField label="Telefone (fixo)" width="lg">
                    <FormInput
                      value={form.telefone_fixo || ''}
                      onChange={(e) => setForm({ ...form, telefone_fixo: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Telefone (móvel)" width="lg">
                    <FormInput
                      value={form.telefone_movel || ''}
                      onChange={(e) => setForm({ ...form, telefone_movel: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Email" required width="xl">
                    <FormInput
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Contactos secundários" icon={Phone}>
                <div className="space-y-4">
                  {form.contactos_secundarios.map((c, index) => (
                    <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Contacto {index + 1}</p>
                      <div className={FORM.fieldRow}>
                        <FormField label="Nome" width="lg">
                          <FormInput
                            value={c.nome}
                            onChange={(e) => updateContacto(index, { nome: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Função" width="lg">
                          <FormInput
                            value={c.funcao}
                            onChange={(e) => updateContacto(index, { funcao: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Email" width="lg">
                          <FormInput
                            type="email"
                            value={c.email}
                            onChange={(e) => updateContacto(index, { email: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Telefone" width="md">
                          <FormInput
                            value={c.telefone}
                            onChange={(e) => updateContacto(index, { telefone: e.target.value })}
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Locais de trabalho" icon={MapPin}>
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span />
                      <span>Entidade</span>
                      <span />
                    </div>
                    {form.locais_trabalho.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">Sem locais de trabalho. Adicione uma entidade.</div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {form.locais_trabalho.map((local, index) => (
                          <div key={`${local.entidade_id}-${index}`} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center px-3 py-2.5">
                            <ChevronRight className="w-4 h-4 text-sky-500 shrink-0" />
                            <FormRadixSelect
                              value={local.entidade_id}
                              onChange={(v) => updateLocal(index, v)}
                              options={entidadeOptions}
                            />
                            <button type="button" onClick={() => removeLocal(index)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={addLocal} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition">
                    <Plus className="w-4 h-4" /> Adicionar local de trabalho
                  </button>
                </div>
              </DetailSection>

              <div className="px-5 py-3.5 sm:px-6 sm:py-4">
                <label className={FORM.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.ativo !== false}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className={CHECKBOX_INPUT_CLASS}
                  />
                  <span>Médico ativo</span>
                </label>
              </div>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Notas" icon={StickyNote}>
                <FormField label="Notas internas" width="3xl">
                  <FormTextarea
                    className="min-h-[180px]"
                    value={form.notas || ''}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    placeholder="Notas internas sobre o médico…"
                  />
                </FormField>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'condicoes' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Testes" icon={FlaskConical}>
                {testesAtivos.length === 0 ? (
                  <p className="text-sm text-slate-500">Não existem testes ativos na Administração.</p>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="grid grid-cols-[1fr_9rem_9rem] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span>Nome</span>
                      <span className="text-right">Comissão</span>
                      <span className="text-right">Prazo de pagamento</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[28rem] overflow-y-auto">
                      {form.condicoes_testes.map((c) => {
                        const teste = testesPorId.get(c.teste_id);
                        if (!teste) return null;
                        return (
                          <div key={c.teste_id} className="grid grid-cols-[1fr_9rem_9rem] gap-2 items-center px-3 py-2.5">
                            <span className="text-sm text-slate-800 dark:text-slate-100 pr-2">
                              {testesLabelPorId.get(c.teste_id) ?? teste.nome}
                            </span>
                            <div className="relative">
                              <FormNumberInput
                                inputMode="decimal"
                                className="pr-7 text-right tabular-nums"
                                value={c.comissao}
                                onChange={(e) => updateCondicao(c.teste_id, { comissao: e.target.value })}
                                placeholder="0"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">€</span>
                            </div>
                            <div className="relative">
                              <FormNumberInput
                                inputMode="numeric"
                                className="pr-10 text-right tabular-nums"
                                value={c.prazo_pagamento_dias}
                                onChange={(e) => updateCondicao(c.teste_id, { prazo_pagamento_dias: e.target.value })}
                                placeholder="0"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">dias</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'relatorios' && (
          <FormTabContent>
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Esta secção ficará disponível numa fase posterior.
            </div>
          </FormTabContent>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}
