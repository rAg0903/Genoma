import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { FlaskConical, Loader2, MapPin, Phone, Receipt, Save, StickyNote, User } from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  ContactoSecundario,
  Entidade,
  Laboratorio,
  LocalCondicaoTesteInput,
  Posto,
  Teste,
} from '../data/types';
import { DetailPanel, DetailSection, DetailDivider } from './ContactDetail';
import { LaboratorioPostosPanel } from './LaboratorioPostosPanel';
import {
  FormAvatarInitials,
  FormField,
  FormInput,
  FormPageBody,
  FormPageHeader,
  FormPageShell,
  FormPrimaryButton,
  FormSectionNote,
  FormTabContent,
  FormTextarea,
} from './shared/FormPageChrome';
import { getTestesSelecionaveis } from '../../lib/testes';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';
import { useLanguage } from '../../i18n/LanguageContext';

export type LocalKind = 'posto' | 'laboratorio' | 'entidade';

type TabId = 'identificacao' | 'postos' | 'condicoes' | 'notas';

type LocalFormState = {
  nome: string;
  codigo: string;
  morada: string;
  codigo_postal: string;
  cidade: string;
  distrito: string;
  pais: string;
  contacto: string;
  email: string;
  contactos_secundarios: ContactoSecundario[];
  condicoes_testes: LocalCondicaoTesteInput[];
  notas: string;
  ativo: boolean;
};

const emptyContacto = (): ContactoSecundario => ({ nome: '', funcao: '', email: '', telefone: '' });

const normalizeContactos = (items?: ContactoSecundario[]) => {
  const list = [...(items || [])];
  while (list.length < 3) list.push(emptyContacto());
  return list.slice(0, 3);
};

const mergeCondicoesComCatalogo = (testes: Teste[], atuais: LocalCondicaoTesteInput[]) => {
  const byId = new Map(atuais.map((c) => [c.teste_id, c]));
  return testes.map((t) => ({
    teste_id: t.id,
    comissao: byId.get(t.id)?.comissao ?? '',
    prazo_pagamento_dias: byId.get(t.id)?.prazo_pagamento_dias ?? '',
  }));
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';

const emptyForm = (): LocalFormState => ({
  nome: '',
  codigo: '',
  morada: '',
  codigo_postal: '',
  cidade: '',
  distrito: '',
  pais: '',
  contacto: '',
  email: '',
  contactos_secundarios: normalizeContactos(),
  condicoes_testes: [],
  notas: '',
  ativo: true,
});

const KIND_LIST_TAB: Record<LocalKind, string> = {
  posto: 'postos',
  laboratorio: 'laboratorios',
  entidade: 'entidades',
};

const kindTranslationPrefix = (kind: LocalKind) => `pages.admin.form.local.${kind}` as const;

const toFormState = (item: Posto | Laboratorio | Entidade): LocalFormState => ({
  nome: item.nome,
  codigo: item.codigo || '',
  morada: item.morada || '',
  codigo_postal: item.codigo_postal || '',
  cidade: item.cidade || '',
  distrito: item.distrito || '',
  pais: item.pais || '',
  contacto: item.contacto || '',
  email: item.email || '',
  contactos_secundarios: normalizeContactos(item.contactos_secundarios),
  condicoes_testes: (item.condicoes_testes || []).map((c) => ({
    teste_id: c.teste_id,
    comissao: c.comissao != null ? String(c.comissao) : '',
    prazo_pagamento_dias: c.prazo_pagamento_dias != null ? String(c.prazo_pagamento_dias) : '',
  })),
  notas: item.notas || '',
  ativo: item.ativo !== false,
});

type LocalFormPageProps = {
  kind: LocalKind;
  laboratorioId?: string;
  defaultLabTipo?: 'operacional' | 'final';
};

export function LocalFormPage({ kind, laboratorioId, defaultLabTipo = 'operacional' }: LocalFormPageProps) {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const {
    postos,
    laboratorios,
    entidades,
    testes,
    addPosto,
    updatePosto,
    addLaboratorio,
    updateLaboratorio,
    addEntidade,
    updateEntidade,
    refreshPostos,
    refreshLaboratorios,
    refreshEntidades,
  } = useData();

  const kindPrefix = kindTranslationPrefix(kind);
  const kindTitle = t(`${kindPrefix}.title`);
  const listTab = KIND_LIST_TAB[kind];
  const editing = Boolean(id);
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');
  const canDelete = hasPermission('definicoes', 'delete');
  const podeGuardar = editing ? canUpdate : canCreate;

  const backPath = useMemo(() => {
    if (kind === 'posto' && laboratorioId) {
      return `/definicoes/laboratorios/${laboratorioId}/editar?tab=postos`;
    }
    return `/definicoes?tab=${listTab}`;
  }, [listTab, kind, laboratorioId]);

  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<TabId>(() => {
    if (kind === 'laboratorio' && initialTab === 'postos') return 'postos';
    return 'identificacao';
  });
  const [form, setForm] = useState<LocalFormState>(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const items = kind === 'posto' ? postos : kind === 'laboratorio' ? laboratorios : entidades;
  const existing = useMemo(
    () => (id ? items.find((item) => item.id === id) : undefined),
    [id, items],
  );

  const parentLaboratorio = useMemo(
    () => (laboratorioId ? laboratorios.find((lab) => lab.id === laboratorioId) : undefined),
    [laboratorioId, laboratorios],
  );
  const inheritsFromLaboratorio = kind === 'posto' && Boolean(laboratorioId && parentLaboratorio);

  const isLabFinal = kind === 'laboratorio' && (
    (editing && existing?.tipo === 'final') || (!editing && defaultLabTipo === 'final')
  );

  const testesAtivos = useMemo(
    () => [...getTestesSelecionaveis(testes)].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [testes],
  );

  const inheritedCondicoes = useMemo(() => {
    if (!inheritsFromLaboratorio || !parentLaboratorio) return [];
    return mergeCondicoesComCatalogo(
      testesAtivos,
      (parentLaboratorio.condicoes_testes || []).map((c) => ({
        teste_id: c.teste_id,
        comissao: c.comissao != null ? String(c.comissao) : '',
        prazo_pagamento_dias: c.prazo_pagamento_dias != null ? String(c.prazo_pagamento_dias) : '',
      })),
    );
  }, [inheritsFromLaboratorio, parentLaboratorio, testesAtivos]);

  const testesPorId = useMemo(() => new Map(testesAtivos.map((t) => [t.id, t])), [testesAtivos]);

  const { handleCodigoPostalChange, autofillFromCp } = useMemo(
    () => createPostalCodeAutofillHandlers(setForm),
    [],
  );

  useEffect(() => {
    if (!inheritsFromLaboratorio || !parentLaboratorio) return;
    setForm((prev) => ({
      ...prev,
      condicoes_testes: inheritedCondicoes,
    }));
  }, [inheritsFromLaboratorio, parentLaboratorio, inheritedCondicoes]);

  useEffect(() => {
    if (kind !== 'laboratorio' || initialTab !== 'postos' || !editing) return;
    setTab('postos');
  }, [editing, initialTab, kind]);

  useEffect(() => {
    if (testesAtivos.length === 0 || inheritsFromLaboratorio) return;
    setForm((prev) => ({
      ...prev,
      condicoes_testes: mergeCondicoesComCatalogo(testesAtivos, prev.condicoes_testes),
    }));
  }, [inheritsFromLaboratorio, testesAtivos]);

  useEffect(() => {
    if (!editing) return;

    const load = async () => {
      setLoading(true);
      try {
        if (kind === 'posto') {
          await Promise.all([refreshPostos(), refreshLaboratorios()]);
        } else if (kind === 'laboratorio') {
          await Promise.all([refreshLaboratorios(), refreshPostos()]);
        } else await refreshEntidades();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [editing, kind, refreshPostos, refreshLaboratorios, refreshEntidades]);

  useEffect(() => {
    if (editing || kind !== 'posto' || !laboratorioId) return;
    void refreshLaboratorios();
  }, [editing, kind, laboratorioId, refreshLaboratorios]);

  useEffect(() => {
    if (!editing) {
      setForm(emptyForm());
      return;
    }
    if (!existing) return;
    const state = toFormState(existing);
    setForm({
      ...state,
      condicoes_testes: testesAtivos.length > 0
        ? mergeCondicoesComCatalogo(testesAtivos, state.condicoes_testes)
        : state.condicoes_testes,
    });
  }, [editing, existing, testesAtivos]);

  useEffect(() => {
    if (!editing || loading || existing) return;
    toast.error(t(`${kindPrefix}.notFound`));
    navigate(backPath);
  }, [backPath, kindPrefix, editing, existing, loading, navigate, t]);

  const displayName = form.nome.trim() || (
    editing ? t('pages.admin.form.local.editKind', { kind: kindTitle.toLowerCase() }) : t(`${kindPrefix}.iconLabel`)
  );
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const tabs: { id: TabId; label: string; icon: typeof User }[] = useMemo(() => {
    const base: { id: TabId; label: string; icon: typeof User }[] = [
      { id: 'identificacao', label: t('form.tabs.identificacao'), icon: User },
    ];
    if (kind === 'laboratorio' && !isLabFinal) {
      base.push({ id: 'postos', label: t('form.tabs.postos'), icon: MapPin });
    }
    if (!isLabFinal) {
      base.push({ id: 'condicoes', label: t('form.tabs.condicoes'), icon: Receipt });
    }
    base.push({ id: 'notas', label: t('form.tabs.notas'), icon: StickyNote });
    return base;
  }, [kind, isLabFinal, t]);

  const updateContacto = (index: number, patch: Partial<ContactoSecundario>) => {
    setForm((prev) => {
      const next = [...prev.contactos_secundarios];
      next[index] = { ...next[index], ...patch };
      return { ...prev, contactos_secundarios: next };
    });
  };

  const updateCondicao = (testeId: string, patch: Partial<LocalCondicaoTesteInput>) => {
    setForm((prev) => ({
      ...prev,
      condicoes_testes: prev.condicoes_testes.map((c) => (
        c.teste_id === testeId ? { ...c, ...patch } : c
      )),
    }));
  };

  const handleGuardar = async () => {
    if (!form.nome.trim()) {
      toast.error(t('form.errors.nameRequired'));
      setTab('identificacao');
      return;
    }

    setSaving(true);
    try {
      const addressFields = kind === 'laboratorio' && !isLabFinal
        ? { morada: '', codigo_postal: '', cidade: '', distrito: '', pais: '' }
        : {
            morada: form.morada.trim(),
            codigo_postal: form.codigo_postal.trim(),
            cidade: form.cidade.trim(),
            distrito: form.distrito.trim(),
            pais: form.pais.trim(),
          };

      const payload = {
        nome: form.nome.trim(),
        codigo: kind === 'posto' ? form.codigo.trim() : '',
        ...addressFields,
        contacto: form.contacto.trim(),
        email: form.email.trim(),
        contactos_secundarios: form.contactos_secundarios,
        ...(!inheritsFromLaboratorio && !isLabFinal ? { condicoes_testes: form.condicoes_testes } : {}),
        notas: form.notas.trim(),
        ativo: form.ativo,
        ...(kind === 'laboratorio' ? { tipo: isLabFinal ? 'final' : 'operacional' } : {}),
        ...(kind === 'posto' && laboratorioId ? { laboratorio_id: laboratorioId } : {}),
      };

      if (editing && id) {
        if (kind === 'posto') await updatePosto(id, payload);
        else if (kind === 'laboratorio') await updateLaboratorio(id, payload);
        else await updateEntidade(id, payload);
        toast.success(t(`${kindPrefix}.updated`));
        if (kind !== 'laboratorio') {
          navigate(backPath);
        }
      } else if (kind === 'posto') {
        await addPosto(payload);
        toast.success(t(`${kindPrefix}.created`));
        navigate(backPath);
      } else if (kind === 'laboratorio') {
        const newId = await addLaboratorio(payload);
        toast.success(t(isLabFinal ? `${kindPrefix}.createdFinal` : `${kindPrefix}.created`));
        if (newId && !isLabFinal) {
          navigate(`/definicoes/laboratorios/${newId}/editar?tab=postos`);
        } else if (newId) {
          navigate(`/definicoes/laboratorios/${newId}/editar`);
        } else {
          navigate('/definicoes?tab=laboratorios');
        }
      } else {
        await addEntidade(payload);
        toast.success(t(`${kindPrefix}.created`));
        navigate(backPath);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages.admin.form.local.saveError', { kind: kindTitle.toLowerCase() }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('common.loading')}
      </div>
    );
  }

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={() => navigate(backPath)}
          title={displayName}
          subtitle={editing
            ? (isLabFinal ? t('pages.admin.form.local.labFinalEditSubtitle') : t(`${kindPrefix}.editSubtitle`))
            : (isLabFinal ? t('pages.admin.form.local.labFinalCreateSubtitle') : t(`${kindPrefix}.createSubtitle`))}
          avatar={<FormAvatarInitials initials={initials} />}
          actions={podeGuardar && tab !== 'postos' ? (
            <FormPrimaryButton onClick={() => void handleGuardar()} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? t('form.saving') : t('common.save')}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={tabs}
          activeTab={tab}
          onTabChange={setTab}
        />

        {tab === 'postos' && kind === 'laboratorio' && (
          editing && id ? (
            <LaboratorioPostosPanel
              laboratorioId={id}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ) : (
            <div className="max-w-3xl rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('pages.admin.form.local.saveLabFirst')}
            </div>
          )
        )}

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.identificacao')} icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.nome')} required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder={t(`${kindPrefix}.nomePlaceholder`)}
                    />
                  </FormField>
                  {kind === 'posto' && (
                    <FormField label={t('form.fields.codigo')} width="md">
                      <FormInput
                        className="font-mono tabular-nums"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        placeholder={t(`${kindPrefix}.codigoPlaceholder`)}
                      />
                    </FormField>
                  )}
                </div>
                {kind === 'laboratorio' && !isLabFinal && (
                  <div className="mt-3">
                    <FormSectionNote>
                      {t('pages.admin.form.local.labOperacionalNote')}
                    </FormSectionNote>
                  </div>
                )}
                {kind === 'laboratorio' && isLabFinal && (
                  <div className="mt-3">
                    <FormSectionNote>
                      {t('pages.admin.form.local.labFinalNote')}
                    </FormSectionNote>
                  </div>
                )}
              </DetailSection>

              {(kind !== 'laboratorio' || isLabFinal) && (
                <>
                  <DetailDivider />
                  <DetailSection title={t('form.sections.morada')} icon={MapPin}>
                    <div className={FORM.fieldRow}>
                      <FormField label={t('form.fields.morada')} width="3xl">
                        <FormInput
                          value={form.morada}
                          onChange={(e) => setForm({ ...form, morada: e.target.value })}
                          placeholder={t('form.placeholders.enderecoCompleto')}
                        />
                      </FormField>
                      <FormField label={t('form.fields.codigoPostal')} width="sm">
                        <FormInput
                          className="font-mono tabular-nums"
                          value={form.codigo_postal}
                          onChange={(e) => handleCodigoPostalChange(e.target.value)}
                          onBlur={(e) => void autofillFromCp(e.target.value)}
                          placeholder={t('form.placeholders.codigoPostal')}
                        />
                      </FormField>
                      <FormField label={t('form.fields.cidade')} width="lg">
                        <FormInput
                          value={form.cidade}
                          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                          placeholder={t('form.placeholders.cidade')}
                        />
                      </FormField>
                      <FormField label={t('form.fields.distrito')} width="lg">
                        <FormInput
                          value={form.distrito}
                          onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                          placeholder={t('form.placeholders.cidade')}
                        />
                      </FormField>
                      <FormField label={t('form.fields.pais')} width="md">
                        <FormInput
                          value={form.pais}
                          onChange={(e) => setForm({ ...form, pais: e.target.value })}
                          placeholder={t('form.placeholders.pais')}
                        />
                      </FormField>
                    </div>
                    <div className="mt-3">
                      <FormSectionNote>
                        {t('form.notes.postalAutofill')}
                      </FormSectionNote>
                    </div>
                  </DetailSection>
                </>
              )}

              <DetailDivider />

              <DetailSection title={t('form.sections.contactos')} icon={Phone}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.telefone')} width="lg">
                    <FormInput
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      placeholder={t('form.placeholders.telefone')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.email')} width="xl">
                    <FormInput
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t('form.placeholders.email')}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('form.sections.contactosSecundarios')} icon={Phone}>
                <div className="space-y-4">
                  {form.contactos_secundarios.map((contacto, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('form.contactN', { n: index + 1 })}
                      </p>
                      <div className={FORM.fieldRow}>
                        <FormField label={t('form.fields.nome')} width="lg">
                          <FormInput
                            value={contacto.nome}
                            onChange={(e) => updateContacto(index, { nome: e.target.value })}
                          />
                        </FormField>
                        <FormField label={t('form.fields.funcao')} width="lg">
                          <FormInput
                            value={contacto.funcao}
                            onChange={(e) => updateContacto(index, { funcao: e.target.value })}
                          />
                        </FormField>
                        <FormField label={t('form.fields.email')} width="lg">
                          <FormInput
                            type="email"
                            value={contacto.email}
                            onChange={(e) => updateContacto(index, { email: e.target.value })}
                          />
                        </FormField>
                        <FormField label={t('form.fields.telefone')} width="lg">
                          <FormInput
                            value={contacto.telefone}
                            onChange={(e) => updateContacto(index, { telefone: e.target.value })}
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>

              <div className="px-5 py-3.5 sm:px-6 sm:py-4">
                <label className={FORM.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className={CHECKBOX_INPUT_CLASS}
                  />
                  <span>{t('pages.admin.form.local.ativo', { kind: kindTitle })}</span>
                </label>
              </div>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'condicoes' && (
          <FormTabContent>
            {inheritsFromLaboratorio && (
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {t('pages.admin.form.local.inheritedConditions', { name: parentLaboratorio?.nome ?? '' })}
              </p>
            )}
            <DetailPanel>
              <DetailSection title={t('form.sections.testes')} icon={FlaskConical}>
              {testesAtivos.length === 0 ? (
                <p className="text-sm text-slate-500">{t('pages.admin.form.local.noActiveTests')}</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="grid grid-cols-[1fr_9rem_9rem] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <span>{t('form.fields.nome')}</span>
                    <span className="text-right">{t('form.fields.comissao')}</span>
                    <span className="text-right">{t('form.fields.prazoPagamento')}</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[28rem] overflow-y-auto">
                    {(inheritsFromLaboratorio ? inheritedCondicoes : form.condicoes_testes).map((c) => {
                      const teste = testesPorId.get(c.teste_id);
                      if (!teste) return null;
                      return (
                        <div key={c.teste_id} className="grid grid-cols-[1fr_9rem_9rem] gap-2 items-center px-3 py-2.5">
                          <span className="text-sm text-slate-800 dark:text-slate-100 pr-2">{teste.nome}</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={`${inputClass} pr-7 text-right tabular-nums ${inheritsFromLaboratorio ? 'bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed' : ''}`}
                              value={c.comissao}
                              onChange={(e) => updateCondicao(c.teste_id, { comissao: e.target.value })}
                              placeholder="0"
                              style={{ fontSize: '13px' }}
                              readOnly={inheritsFromLaboratorio}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">€</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className={`${inputClass} pr-10 text-right tabular-nums ${inheritsFromLaboratorio ? 'bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed' : ''}`}
                              value={c.prazo_pagamento_dias}
                              onChange={(e) => updateCondicao(c.teste_id, { prazo_pagamento_dias: e.target.value })}
                              placeholder="0"
                              style={{ fontSize: '13px' }}
                              readOnly={inheritsFromLaboratorio}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{t('form.days')}</span>
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

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.notasInternas')} icon={StickyNote}>
                <FormField label={t('form.fields.notas')} width="3xl">
                  <FormTextarea
                    className="min-h-[180px]"
                    value={form.notas}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    placeholder={t(`${kindPrefix}.notasPlaceholder`)}
                  />
                </FormField>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}

export function PostoFormPage() {
  const { laboratorioId } = useParams();
  if (!laboratorioId) {
    return <Navigate to="/definicoes?tab=laboratorios" replace />;
  }
  return <LocalFormPage kind="posto" laboratorioId={laboratorioId} />;
}

export function LaboratorioFormPage() {
  return <LocalFormPage kind="laboratorio" defaultLabTipo="operacional" />;
}

export function LaboratorioFinalFormPage() {
  return <LocalFormPage kind="laboratorio" defaultLabTipo="final" />;
}

export function EntidadeFormPage() {
  return <LocalFormPage kind="entidade" />;
}
