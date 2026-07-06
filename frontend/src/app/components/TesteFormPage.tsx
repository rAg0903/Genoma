import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Building2, Clock, Edit, FlaskConical, Layers, Loader2, Plus, Save, StickyNote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Teste } from '../data/types';
import { filterLaboratoriosFinais } from '../../lib/stock-locations';
import { findTestePrincipal, getTestesPrincipais, sortTestesByCodigo } from '../../lib/testes';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { useLanguage } from '../../i18n/LanguageContext';
import { FORM } from '../../lib/design-tokens';
import { DetailDivider, DetailPanel, DetailSection } from './ContactDetail';
import {
  FormField,
  FormInput,
  FormNumberInput,
  FormPageBody,
  FormPageHeader,
  FormPageShell,
  FormPrimaryButton,
  FormRadixSelect,
  FormSectionNote,
  FormTabContent,
  FormTextarea,
} from './shared/FormPageChrome';

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
    codigo: '',
    preco: 0,
    preco_compra: 0,
    preco_venda: 0,
  };
};

type TabId = 'dados' | 'sub_testes';

export function TesteFormPage() {
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
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

  const tabs = useMemo(() => [
    { id: 'dados' as const, label: t('form.tabs.dados'), icon: FlaskConical },
    { id: 'sub_testes' as const, label: t('form.tabs.subTestes'), icon: Layers },
  ], [t]);

  const parentTeste = useMemo(
    () => (id ? findTestePrincipal(testes, id) : undefined),
    [testes, id],
  );
  const subTestes = useMemo(
    () => sortTestesByCodigo(parentTeste?.sub_testes ?? []),
    [parentTeste],
  );

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

  const empresaOptions = useMemo(() => {
    const opts = empresasAtivas.map((e) => ({ value: e.nome, label: e.nome }));
    if (empresaOrfa) opts.push({ value: empresaOrfa, label: empresaOrfa });
    return opts;
  }, [empresasAtivas, empresaOrfa]);

  const tipoKitOptions = useMemo(
    () => tiposKit.filter((t) => t.ativo !== false).map((t) => ({ value: t.nome, label: t.nome })),
    [tiposKit],
  );

  const laboratorioOptions = useMemo(
    () => laboratoriosFinais.map((l) => ({ value: l.id, label: l.nome })),
    [laboratoriosFinais],
  );

  useEffect(() => {
    if (!id) return;
    setCatalogReady(false);
    setLoading(true);
    void refreshTestes()
      .then(() => setCatalogReady(true))
      .catch(() => {
        toast.error(t('pages.admin.form.teste.loadError'));
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
    toast.error(t('pages.admin.form.teste.notFound'));
    voltar();
  }, [id, catalogReady, testes, navigate, t]);

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!podeGuardar) return;
    setSaving(true);
    try {
      const payload = buildTestePayload(form);
      if (editing && id) {
        await updateTeste(id, payload);
        toast.success(t('pages.admin.form.teste.updated'));
      } else {
        await addTeste(payload);
        toast.success(t('pages.admin.form.teste.created'));
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.admin.form.teste.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const openNewSubTeste = () => navigate(`/definicoes/testes/${id}/sub-testes/novo`);
  const openEditSubTeste = (subId: string) => navigate(`/definicoes/testes/${id}/sub-testes/${subId}/editar`);

  const handleDeleteSubTeste = async (subId: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o sub-teste', nome)))) return;
    void deleteSubTeste(subId)
      .then(() => toast.success(t('pages.admin.form.teste.subTesteDeleted')))
      .catch((e) => toast.error(e instanceof Error ? e.message : t('pages.admin.form.teste.subTesteDeleteError')));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('pages.admin.form.teste.loading')}
      </div>
    );
  }

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={voltar}
          title={editing ? t('pages.admin.form.teste.edit') : t('pages.admin.form.teste.new')}
          subtitle={form.nome || t('pages.admin.form.teste.defaultSubtitle')}
          avatar={(
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
          )}
          actions={podeGuardar && tab === 'dados' ? (
            <FormPrimaryButton type="submit" form="teste-form" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? t('common.save') : t('form.create')}
            </FormPrimaryButton>
          ) : undefined}
          tabs={editing ? tabs : undefined}
          activeTab={editing ? tab : undefined}
          onTabChange={editing ? setTab : undefined}
        />

        {tab === 'dados' && (
          <FormTabContent>
            <form id="teste-form" onSubmit={(e) => void handleSave(e)}>
              <DetailPanel>
                <DetailSection title={t('form.sections.identificacao')} icon={FlaskConical}>
                  <div className={FORM.fieldRow}>
                    <FormField label={t('form.fields.nomeTeste')} required width="2xl">
                      <FormInput
                        required
                        name="teste-nome"
                        value={form.nome}
                        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                        placeholder={t('form.placeholders.nomeTeste')}
                      />
                    </FormField>
                  </div>
                </DetailSection>

                <DetailDivider />

                <DetailSection title={t('form.sections.configuracao')} icon={Building2}>
                  <div className={FORM.fieldRow}>
                    <FormField label={t('form.fields.empresa')} width="xl">
                      <FormRadixSelect
                        value={form.empresa}
                        onChange={(v) => setForm((f) => ({ ...f, empresa: v }))}
                        placeholder={t('form.select')}
                        options={empresaOptions}
                      />
                    </FormField>
                    <FormField label={t('form.fields.tipoKit')} width="lg">
                      <FormRadixSelect
                        value={form.tipo_kit}
                        onChange={(v) => setForm((f) => ({ ...f, tipo_kit: v }))}
                        placeholder={t('form.select')}
                        options={tipoKitOptions}
                      />
                    </FormField>
                    <FormField label={t('form.fields.laboratorioFinal')} required width="2xl">
                      <FormRadixSelect
                        value={form.laboratorio_final_id || ''}
                        onChange={(v) => setForm((f) => ({ ...f, laboratorio_final_id: v || null }))}
                        placeholder={t('form.placeholders.selectLaboratorio')}
                        options={laboratorioOptions}
                      />
                    </FormField>
                  </div>
                  <div className="mt-3">
                    <FormSectionNote>
                      {t('pages.admin.form.teste.kitDestinoNote')}
                    </FormSectionNote>
                  </div>
                </DetailSection>

                <DetailDivider />

                <DetailSection title={t('form.sections.parametros')} icon={Clock}>
                  <div className={FORM.fieldRow}>
                    <FormField label={t('form.fields.tempoResposta')} width="sm">
                      <FormNumberInput
                        inputMode="numeric"
                        value={form.tempo_resposta_dias ?? ''}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          tempo_resposta_dias: e.target.value === '' ? null : parseInt(e.target.value, 10),
                        }))}
                        placeholder={t('form.placeholders.tempoResposta')}
                      />
                    </FormField>
                    <FormField label={t('form.fields.gestacaoMinima')} width="sm">
                      <FormNumberInput
                        inputMode="numeric"
                        value={form.gestacao_minima_semanas ?? ''}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          gestacao_minima_semanas: e.target.value === '' ? null : parseInt(e.target.value, 10),
                        }))}
                        placeholder={t('form.placeholders.gestacaoMinima')}
                      />
                    </FormField>
                  </div>
                </DetailSection>

                <DetailDivider />

                <DetailSection title={t('form.sections.descricao')} icon={StickyNote}>
                  <FormField label={t('form.fields.descricao')} width="3xl">
                    <FormTextarea
                      name="teste-descricao"
                      value={form.descricao}
                      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                      rows={3}
                    />
                  </FormField>
                </DetailSection>
              </DetailPanel>
            </form>
          </FormTabContent>
        )}

        {tab === 'sub_testes' && editing && id && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.subTestes')} icon={Layers}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <FormSectionNote className="mb-0">
                    {t('pages.admin.form.teste.subTestesHint')}
                  </FormSectionNote>
                  {canCreate && (
                    <button type="button" onClick={openNewSubTeste} className={`${ADD_ACTION_BUTTON_CLASS} shrink-0`}>
                      <Plus className="w-4 h-4" /> {t('common.create.subTest')}
                    </button>
                  )}
                </div>

                {subTestes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {t('pages.admin.form.teste.noSubTestes')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('form.fields.codigo')}</th>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('form.fields.nome')}</th>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('pages.admin.form.teste.precoVenda')}</th>
                          <th className="px-4 py-2.5 text-right font-semibold">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {subTestes.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-semibold">{st.codigo}</span>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-medium text-gray-800 dark:text-gray-100">{st.nome}</td>
                            <td className="px-4 py-3 text-[14px] font-semibold">{(st.preco_venda ?? st.preco ?? 0).toFixed(2)} €</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                {canUpdate && (
                                  <button type="button" onClick={() => openEditSubTeste(st.id)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" title={t('pages.admin.form.teste.editSubTeste')}>
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button type="button" onClick={() => handleDeleteSubTeste(st.id, st.nome)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title={t('pages.admin.form.teste.deleteSubTeste')}>
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
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}
