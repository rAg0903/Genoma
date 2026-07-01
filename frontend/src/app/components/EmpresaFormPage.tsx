import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2, MapPin, Phone, Save, StickyNote, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';
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

type EmpresaFormState = Omit<Empresa, 'id'>;

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'notas', label: 'Notas', icon: StickyNote },
];

const emptyEmpresa = (): EmpresaFormState => ({
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

const empresaToForm = (e: Empresa): EmpresaFormState => ({
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
  const [form, setForm] = useState<EmpresaFormState>(emptyEmpresa);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

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
        toast.error('Não foi possível carregar a empresa.');
        voltar();
      })
      .finally(() => setLoading(false));
  }, [id, refreshEmpresas, navigate]);

  useEffect(() => {
    if (!id || loading) return;
    const existing = empresas.find((e) => e.id === id);
    if (existing) {
      setForm(empresaToForm(existing));
      return;
    }
    toast.error('Empresa não encontrada.');
    voltar();
  }, [id, loading, empresas, navigate]);

  const displayName = form.nome.trim() || (editing ? 'Editar empresa' : 'Nova empresa');
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const handleGuardar = async () => {
    if (!form.nome.trim()) {
      toast.error('Indique o nome.');
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
        toast.success('Empresa atualizada.');
      } else {
        await addEmpresa(payload);
        toast.success('Empresa criada.');
      }
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível guardar a empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !canDelete) return;
    if (!(await confirmDelete(deleteTargetLabel('a empresa', form.nome || 'esta empresa')))) return;
    try {
      await deleteEmpresa(id);
      toast.success('Empresa eliminada.');
      voltar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível eliminar a empresa.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar…
      </div>
    );
  }

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={voltar}
          title={displayName}
          subtitle={editing ? 'Edição de empresa' : 'Criação de empresa'}
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
                      placeholder="Ex.: Genoma"
                    />
                  </FormField>
                  <FormField label="NIF" width="md">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder="123456789"
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Morada" icon={MapPin}>
                <div className={FORM.fieldRow}>
                  <FormField label="Morada" width="3xl">
                    <FormInput
                      value={form.morada}
                      onChange={(e) => setForm({ ...form, morada: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </FormField>
                  <FormField label="Código postal" width="sm">
                    <FormInput
                      value={form.codigo_postal || ''}
                      onChange={(e) => handleCodigoPostalChange(e.target.value)}
                      onBlur={(e) => void autofillFromCp(e.target.value)}
                      placeholder="0000-000"
                    />
                  </FormField>
                  <FormField label="Cidade" width="lg">
                    <FormInput
                      value={form.cidade || ''}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder="Lisboa"
                    />
                  </FormField>
                  <FormField label="Distrito" width="lg">
                    <FormInput
                      value={form.distrito || ''}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                      placeholder="Lisboa"
                    />
                  </FormField>
                  <FormField label="País" width="md">
                    <FormInput
                      value={form.pais || ''}
                      onChange={(e) => setForm({ ...form, pais: e.target.value })}
                      placeholder="Portugal"
                    />
                  </FormField>
                </div>
                <div className="mt-3">
                  <FormSectionNote>
                    Distrito, cidade e país podem ser preenchidos automaticamente a partir do código postal.
                  </FormSectionNote>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Contactos" icon={Phone}>
                <div className={FORM.fieldRow}>
                  <FormField label="Telefone" width="lg">
                    <FormInput
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      placeholder="912 345 678"
                    />
                  </FormField>
                  <FormField label="Email" width="xl">
                    <FormInput
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contacto@empresa.pt"
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
                  <span>Empresa ativa</span>
                </label>

                {editing && canDelete && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-[#3d4f6a]/45">
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar empresa
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
              <DetailSection title="Notas internas" icon={StickyNote}>
                <FormField label="Notas" width="3xl">
                  <FormTextarea
                    className="min-h-[180px]"
                    value={form.notas || ''}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    placeholder="Notas internas sobre a empresa…"
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
