import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Edit, FlaskConical, Loader2, Package, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CHECKBOX_INPUT_CLASS, ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { FORM } from '../../lib/design-tokens';
import { formatSubTestesResumo, getTestesPrincipais } from '../../lib/testes';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useData } from '../context/DataContext';
import { TipoKit } from '../data/types';
import { DetailPanel, DetailSection } from './ContactDetail';
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

const emptyTipoKit = (): Omit<TipoKit, 'id'> => ({ nome: '', descricao: '', ativo: true });

const toForm = (t: TipoKit): Omit<TipoKit, 'id'> => ({
  nome: t.nome,
  descricao: t.descricao || '',
  ativo: t.ativo !== false,
});

type TabId = 'dados' | 'testes';

export function TipoKitFormPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { tiposKit, testes, addTipoKit, updateTipoKit, deleteTeste, refreshTiposKit, refreshTestes } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');
  const canDelete = hasPermission('definicoes', 'delete');

  const editing = Boolean(id);
  const [form, setForm] = useState<Omit<TipoKit, 'id'>>(emptyTipoKit);
  const [linkedNome, setLinkedNome] = useState('');
  const [loading, setLoading] = useState(editing);
  const [catalogReady, setCatalogReady] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const initialTab = searchParams.get('tab') === 'testes' ? 'testes' : 'dados';
  const [tab, setTab] = useState<TabId>(initialTab);

  const tabs = useMemo(() => [
    { id: 'dados' as const, label: t('form.tabs.dados'), icon: Package },
    { id: 'testes' as const, label: t('form.tabs.testes'), icon: FlaskConical },
  ], [t]);

  const linkedTestes = useMemo(
    () => getTestesPrincipais(testes).filter((teste) => teste.tipo_kit === linkedNome),
    [testes, linkedNome],
  );

  const voltar = () => navigate('/definicoes?tab=tipos_kit');
  const podeGuardar = editing ? canUpdate : canCreate;

  useEffect(() => {
    if (!id) return;
    setCatalogReady(false);
    setLoading(true);
    void Promise.all([refreshTiposKit(), refreshTestes()])
      .then(() => setCatalogReady(true))
      .catch(() => {
        toast.error(t('pages.admin.form.tipoKit.loadError'));
        voltar();
      });
  }, [id, refreshTiposKit, refreshTestes, t]);

  useEffect(() => {
    if (!id || !catalogReady) return;
    const existing = tiposKit.find((item) => item.id === id);
    if (existing) {
      setForm(toForm(existing));
      setLinkedNome(existing.nome);
      setLoading(false);
      return;
    }
    setLoading(false);
    toast.error(t('pages.admin.form.tipoKit.notFound'));
    voltar();
  }, [id, catalogReady, tiposKit, t]);

  const displayName = form.nome.trim() || (editing ? t('pages.admin.form.tipoKit.edit') : t('pages.admin.form.tipoKit.new'));
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'TK';

  const handleGuardar = async () => {
    if (!form.nome.trim()) {
      toast.error(t('form.errors.nameRequired'));
      return;
    }
    if (!podeGuardar) return;

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || '',
        ativo: form.ativo !== false,
      };
      if (editing && id) {
        await updateTipoKit(id, payload);
        setLinkedNome(payload.nome);
        toast.success(t('pages.admin.form.tipoKit.updated'));
      } else {
        await addTipoKit(payload);
        toast.success(t('pages.admin.form.tipoKit.created'));
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.admin.form.tipoKit.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const openNewTeste = () => {
    const params = new URLSearchParams();
    if (linkedNome) params.set('tipo_kit', linkedNome);
    navigate(`/definicoes/testes/novo?${params.toString()}`);
  };

  const openEditTeste = (testeId: string) => navigate(`/definicoes/testes/${testeId}/editar`);

  const handleDeleteTeste = async (testeId: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o teste', nome)))) return;
    void deleteTeste(testeId)
      .then(() => toast.success(t('pages.admin.form.tipoKit.testeDeleted')))
      .catch((e) => toast.error(e instanceof Error ? e.message : t('pages.admin.form.tipoKit.testeDeleteError')));
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
          subtitle={editing ? t('pages.admin.form.tipoKit.editSubtitle') : t('pages.admin.form.tipoKit.createSubtitle')}
          avatar={<FormAvatarInitials initials={initials} />}
          actions={podeGuardar && tab === 'dados' ? (
            <FormPrimaryButton onClick={() => void handleGuardar()} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? t('form.saving') : t('common.save')}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={editing ? tabs : undefined}
          activeTab={editing ? tab : undefined}
          onTabChange={editing ? setTab : undefined}
        />

        {tab === 'dados' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.identificacao')} icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.nome')} required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder={t('pages.admin.form.tipoKit.nomePlaceholder')}
                    />
                  </FormField>
                </div>
                <div className={`${FORM.fieldRow} mt-4`}>
                  <FormField label={t('form.fields.descricao')} width="3xl">
                    <FormTextarea
                      value={form.descricao || ''}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={3}
                    />
                  </FormField>
                </div>
                <div className="mt-4">
                  <label className={FORM.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.ativo !== false}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                      className={CHECKBOX_INPUT_CLASS}
                    />
                    <span>{t('pages.admin.form.tipoKit.ativo')}</span>
                  </label>
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'testes' && editing && id && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('form.sections.testes')} icon={FlaskConical}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <FormSectionNote className="mb-0">
                    {t('pages.admin.form.tipoKit.testesHint')}
                  </FormSectionNote>
                  {canCreate && (
                    <button type="button" onClick={openNewTeste} className={`${ADD_ACTION_BUTTON_CLASS} shrink-0`}>
                      <Plus className="w-4 h-4" /> {t('common.create.test')}
                    </button>
                  )}
                </div>

                {linkedTestes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {t('pages.admin.form.tipoKit.noTestes')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('form.fields.nome')}</th>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('form.fields.descricao')}</th>
                          <th className="px-4 py-2.5 text-left font-semibold">{t('pages.admin.form.teste.precoVenda')} (sub-testes)</th>
                          <th className="px-4 py-2.5 text-right font-semibold">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {linkedTestes.map((teste) => (
                          <tr key={teste.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3 text-[13px] font-medium text-gray-800 dark:text-gray-100">{teste.nome}</td>
                            <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 max-w-[250px]">{teste.descricao || '—'}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">{formatSubTestesResumo(teste)}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                {canUpdate && (
                                  <button type="button" onClick={() => openEditTeste(teste.id)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" title={t('pages.admin.form.teste.edit')}>
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button type="button" onClick={() => void handleDeleteTeste(teste.id, teste.nome)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title={t('pages.admin.form.teste.delete')}>
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
