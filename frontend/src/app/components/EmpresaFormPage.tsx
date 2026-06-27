import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2, MapPin, Phone, Save, StickyNote, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { CHECKBOX_INPUT_CLASS, FORM_INPUT_CLASS } from '../../lib/design-system';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Empresa } from '../data/types';
import { Section } from './ContactDetail';
import { FormAvatarInitials, FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton } from './shared/FormPageChrome';

type TabId = 'identificacao' | 'notas';

type EmpresaFormState = Omit<Empresa, 'id'>;

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'notas', label: 'Notas', icon: StickyNote },
];

const inputClass = FORM_INPUT_CLASS;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

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
    if (!confirm(`Eliminar ${form.nome || 'esta empresa'}?`)) return;
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
          <div className="space-y-4 max-w-4xl">
            <Section title="Identificação" icon={User}>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: Genoma"
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>NIF</label>
                  <input
                    className={inputClass}
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value })}
                    placeholder="123456789"
                    style={{ fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </Section>

            <Section title="Morada" icon={MapPin}>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Morada</label>
                  <input
                    className={inputClass}
                    value={form.morada}
                    onChange={(e) => setForm({ ...form, morada: e.target.value })}
                    placeholder="Endereço completo"
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Código postal</label>
                    <input
                      className={inputClass}
                      value={form.codigo_postal || ''}
                      onChange={(e) => handleCodigoPostalChange(e.target.value)}
                      onBlur={(e) => void autofillFromCp(e.target.value)}
                      placeholder="0000-000"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Cidade</label>
                    <input
                      className={inputClass}
                      value={form.cidade || ''}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder="Lisboa"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>
                <p className="text-gray-400 dark:text-gray-500 -mt-2" style={{ fontSize: '11px' }}>
                  Distrito, cidade e país podem ser preenchidos automaticamente a partir do código postal.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Distrito</label>
                    <input
                      className={inputClass}
                      value={form.distrito || ''}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                      placeholder="Lisboa"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>País</label>
                    <input
                      className={inputClass}
                      value={form.pais || ''}
                      onChange={(e) => setForm({ ...form, pais: e.target.value })}
                      placeholder="Portugal"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Contactos" icon={Phone}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Telefone</label>
                  <input
                    className={inputClass}
                    value={form.contacto}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    placeholder="912 345 678"
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contacto@empresa.pt"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>
            </Section>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.ativo !== false}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                className={CHECKBOX_INPUT_CLASS}
              />
              <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
                Empresa ativa
              </span>
            </label>

            {editing && canDelete && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar empresa
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'notas' && (
          <div className="max-w-3xl">
            <Section title="Notas" icon={StickyNote}>
              <textarea
                className={`${inputClass} min-h-[180px]`}
                value={form.notas || ''}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Notas internas sobre a empresa…"
                style={{ fontSize: '14px' }}
              />
            </Section>
          </div>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}
