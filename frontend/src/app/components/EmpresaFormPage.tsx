import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2, MapPin, Phone, Save, StickyNote, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { Empresa } from '../data/types';
import { DetailDivider, DetailPanel, DetailSection } from './ContactDetail';
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

type TabId = 'identificacao' | 'notas';

const emptyEmpresa = (): Omit<Empresa, 'id'> => ({
  nome: '',
  morada: '',
  codigo_postal: '',
  cidade: '',
  distrito: '',
  contacto: '',
  email: '',
  nif: '',
  pais: '',
  notas: '',
  ativo: true,
});

const empresaToForm = (e: Empresa): Omit<Empresa, 'id'> => ({
  nome: e.nome,
  morada: e.morada,
  codigo_postal: e.codigo_postal || '',
  cidade: e.cidade || '',
  distrito: e.distrito || '',
  contacto: e.contacto,
  email: e.email,
  nif: e.nif,
  pais: e.pais || '',
  notas: e.notas || '',
  ativo: e.ativo !== false,
});

export function EmpresaFormPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { empresas, addEmpresa, updateEmpresa, deleteEmpresa, refreshEmpresas } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');
  const canDelete = hasPermission('definicoes', 'delete');

  const editing = Boolean(id);
  const [tab, setTab] = useState<TabId>('identificacao');
  const [form, setForm] = useState<Omit<Empresa, 'id'>>(emptyEmpresa);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(() => [
    { id: 'identificacao' as const, label: t('form.tabs.identificacao'), icon: User },
    { id: 'notas' as const, label: t('form.tabs.notas'), icon: StickyNote },
  ], [t]);

  const { handleCodigoPostalChange, autofillFromCp } = useMemo(
    () => createPostalCodeAutofillHandlers(setForm),
    [],
  );

  const voltar = () => navigate('/definicoes?tab=empresas');
  const podeGuardar = editing ? canUpdate : canCreate;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void refreshEmpresas()
      .catch(() => {
        toast.error(t('pages.admin.form.empresa.loadError'));
        voltar();
      })
      .finally(() => setLoading(false));
  }, [id, refreshEmpresas, navigate, t]);

  useEffect(() => {
    if (!id || loading) return;
    const existing = empresas.find((e) => e.id === id);
    if (existing) {
      setForm(empresaToForm(existing));
      return;
    }
    toast.error(t('pages.admin.form.empresa.notFound'));
    voltar();
  }, [id, loading, empresas, navigate, t]);

  const displayName = form.nome.trim() || (editing ? t('pages.admin.form.empresa.edit') : t('pages.admin.form.empresa.new'));
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const handleGuardar = async () => {
    if (!form.nome.trim()) {
      toast.error(t('form.errors.nameRequired'));
      setTab('identificacao');
      return;
    }
    if (!podeGuardar) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        nome: form.nome.trim(),
        morada: form.morada.trim(),
        codigo_postal: form.codigo_postal?.trim() || '',
        cidade: form.cidade?.trim() || '',
        distrito: form.distrito?.trim() || '',
        contacto: form.contacto.trim(),
        email: form.email.trim(),
        nif: form.nif.trim(),
        pais: form.pais?.trim() || '',
        notas: form.notas?.trim() || '',
      };
      if (editing && id) {
        await updateEmpresa(id, payload);
        toast.success(t('pages.admin.form.empresa.updated'));
      } else {
        await addEmpresa(payload);
        toast.success(t('pages.admin.form.empresa.created'));
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.admin.form.empresa.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !canDelete) return;
    if (!(await confirmDelete(deleteTargetLabel('a empresa', form.nome || 'esta empresa')))) return;
    try {
      await deleteEmpresa(id);
      toast.success(t('pages.admin.form.empresa.deleted'));
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.admin.form.empresa.deleteError'));
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
          onBack={voltar}
          title={displayName}
          subtitle={editing ? t('pages.admin.form.empresa.editSubtitle') : t('pages.admin.form.empresa.createSubtitle')}
          avatar={<FormAvatarInitials initials={initials} />}
          actions={podeGuardar ? (
            <FormPrimaryButton onClick={() => void handleGuardar()} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? t('form.saving') : t('common.save')}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={tabs}
          activeTab={tab}
          onTabChange={setTab}
        />

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.identificacao')} icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.nome')} required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder={t('pages.admin.form.empresa.nomePlaceholder')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.nif')} width="md">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder={t('form.placeholders.nif')}
                    />
                  </FormField>
                </div>
              </DetailSection>

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
                      value={form.codigo_postal || ''}
                      onChange={(e) => handleCodigoPostalChange(e.target.value)}
                      onBlur={(e) => void autofillFromCp(e.target.value)}
                      placeholder={t('form.placeholders.codigoPostal')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.cidade')} width="lg">
                    <FormInput
                      value={form.cidade || ''}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder={t('form.placeholders.cidade')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.distrito')} width="lg">
                    <FormInput
                      value={form.distrito || ''}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                      placeholder={t('form.placeholders.cidade')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.pais')} width="md">
                    <FormInput
                      value={form.pais || ''}
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

              <div className="px-5 py-3.5 sm:px-6 sm:py-4">
                <label className={FORM.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.ativo !== false}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className={CHECKBOX_INPUT_CLASS}
                  />
                  <span>{t('pages.admin.form.empresa.ativo')}</span>
                </label>

                {editing && canDelete && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-[#3d4f6a]/45">
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('pages.admin.form.empresa.delete')}
                    </button>
                  </div>
                )}
              </div>
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
                    value={form.notas || ''}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    placeholder={t('pages.admin.form.empresa.notasPlaceholder')}
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
