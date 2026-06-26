import React, { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, X, Users, Building2, FlaskConical, ShieldCheck, Package, Stethoscope, Ban, Landmark, type LucideIcon } from 'lucide-react';
import { PerfisPermissoesTab } from './definicoes/PerfisPermissoesTab';
import { MedicosTab } from './MedicosTab';
import { MotivosAnulacaoTab } from './MotivosAnulacaoTab';
import { useData } from '../context/DataContext';
import { Utilizador, Empresa, Teste, TipoKit } from '../data/types';
import { toast } from 'sonner';
import { ADD_ACTION_BUTTON_CLASS, FORM_INPUT_CLASS } from '../../lib/design-system';
import { formatSubTestesResumo, getTestesPrincipais } from '../../lib/testes';
import { StatusBadge } from './shared/StatusBadge';
import { UserAvatar } from './shared/UserAvatar';
import { AdminModuleHeader } from './definicoes/AdminModuleHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { AccessDeniedState } from './shared/AccessDeniedState';
import { ReadOnlyNotice } from './shared/ReadOnlyNotice';
import { DefinicoesSubmodule } from '../../lib/permissions';
import { perfisApi, Perfil } from '../../lib/api-perfis';
import { isAdminPerfilNome, isMedicoPerfilNome } from '../../lib/perfil-utils';
import { useSearchParams } from 'react-router';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import {
  ADMIN_ACTION_BTN_CLASS,
  ADMIN_ATIVO_STATUS_MAP,
  ADMIN_DELETE_BTN_CLASS,
  ADMIN_TABLE_BODY_CLASS,
  ADMIN_TABLE_HEAD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminRowActions,
  AdminTabPanel,
  AdminTabToolbar,
  AdminTableHeadCell,
} from './definicoes/admin-tab-ui';

type Tab = 'utilizadores' | 'permissoes' | 'empresas' | 'testes' | 'tipos_kit' | 'entidades' | 'laboratorios' | 'medicos' | 'motivos_anulacao';

const SETTINGS_TABS: Tab[] = ['utilizadores', 'permissoes', 'empresas', 'testes', 'tipos_kit', 'entidades', 'laboratorios', 'medicos', 'motivos_anulacao'];

const getValidSettingsTab = (tab: string | null, isAdmin: boolean, allowedTabs: Tab[]): Tab => {
  const fallbackTab = allowedTabs[0] ?? 'utilizadores';

  if (!tab || !SETTINGS_TABS.includes(tab as Tab)) {
    return fallbackTab;
  }

  if (!isAdmin && tab === 'permissoes') {
    return fallbackTab;
  }

  if (!allowedTabs.includes(tab as Tab)) {
    return fallbackTab;
  }

  return tab as Tab;
};

const inputClass = FORM_INPUT_CLASS;
const labelClass = "block mb-1.5 text-gray-600 dark:text-gray-400";

const perfilBadgeMap: Record<string, string> = {
  Administrador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Medico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Assistente: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const {
    isAdministrator,
    hasPermission,
    hasDefinicoesSubmodulePermission,
  } = useAuth();
  const isAdmin = isAdministrator;
  const allowedSettingsTabs = SETTINGS_TABS.filter((tab) => {
    if (tab === 'permissoes') {
      return isAdmin;
    }
    return hasDefinicoesSubmodulePermission(tab as DefinicoesSubmodule);
  });
  const activeTab = useMemo(
    () => getValidSettingsTab(searchParams.get('tab'), isAdmin, allowedSettingsTabs),
    [allowedSettingsTabs, isAdmin, searchParams]
  );
  const canRead = hasPermission('definicoes', 'read');
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');
  const canDelete = hasPermission('definicoes', 'delete');

  useEffect(() => {
    const rawTab = searchParams.get('tab');
    const normalizedTab = getValidSettingsTab(rawTab, isAdmin, allowedSettingsTabs);
    const expected = normalizedTab === 'utilizadores' ? null : normalizedTab;

    if ((rawTab ?? null) !== expected) {
      const params = new URLSearchParams(searchParams);
      if (expected === null) {
        params.delete('tab');
      } else {
        params.set('tab', expected);
      }
      setSearchParams(params, { replace: true });
    }
  }, [allowedSettingsTabs, isAdmin, searchParams, setSearchParams]);

  const handleChangeTab = (nextTab: Tab) => {
    const normalizedTab = getValidSettingsTab(nextTab, isAdmin, allowedSettingsTabs);

    const params = new URLSearchParams(searchParams);
    if (normalizedTab === 'utilizadores') {
      params.delete('tab');
    } else {
      params.set('tab', normalizedTab);
    }

    setSearchParams(params, { replace: true });
  };

  const allTabs: { id: Tab; labelKey: string; icon: LucideIcon }[] = [
    { id: 'utilizadores', labelKey: 'navSub.utilizadores', icon: Users },
    { id: 'permissoes', labelKey: 'navSub.permissoes', icon: ShieldCheck },
    { id: 'empresas', labelKey: 'navSub.empresas', icon: Building2 },
    { id: 'testes', labelKey: 'navSub.testes', icon: FlaskConical },
    { id: 'tipos_kit', labelKey: 'navSub.tipos_kit', icon: Package },
    { id: 'entidades', labelKey: 'navSub.entidades', icon: Landmark },
    { id: 'laboratorios', labelKey: 'navSub.laboratorios', icon: FlaskConical },
    { id: 'medicos', labelKey: 'navSub.medicos', icon: Stethoscope },
    { id: 'motivos_anulacao', labelKey: 'navSub.motivos_anulacao', icon: Ban },
  ];

  const tabs = allTabs
    .filter((tab) => {
      if (tab.id === 'permissoes' && !isAdmin) return false;
      return allowedSettingsTabs.includes(tab.id);
    })
    .map((tab) => ({ ...tab, label: t(tab.labelKey) }));

  if (!canRead) {
    return <AccessDeniedState message="O perfil atual nao tem permissao para aceder ao modulo de Administracao." />;
  }

  if (allowedSettingsTabs.length === 0) {
    return <AccessDeniedState message="O perfil atual nao tem permissao para visualizar submodulos de Administracao." />;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AdminModuleHeader
        title={t('pages.admin.title')}
        subtitle={t('pages.admin.subtitle')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleChangeTab}
      />

      <div className="p-4 md:p-6 space-y-5">
        {!canCreate && !canUpdate && !canDelete && (
          <ReadOnlyNotice message="Este perfil pode consultar a administracao, mas nao pode criar, editar ou eliminar registos." />
        )}

        {activeTab === 'utilizadores' && <UtilizadoresTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'permissoes' && isAdmin && <PerfisPermissoesTab />}
        {activeTab === 'empresas' && <EmpresasTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'testes' && <TestesTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'tipos_kit' && <TiposKitTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'entidades' && <EntidadesTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'laboratorios' && <LaboratoriosTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'medicos' && <MedicosTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'motivos_anulacao' && <MotivosAnulacaoTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
      </div>
    </div>
  );
}

/* =========== UTILIZADORES =========== */
function UtilizadoresTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const { utilizadores, addUtilizador, updateUtilizador, deleteUtilizador } = useData();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<Utilizador | null>(null);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [saving, setSaving] = useState(false);
  const perfisCriacao = useMemo(
    () => perfis.filter((p) => !isAdminPerfilNome(p.nome) && !isMedicoPerfilNome(p.nome)),
    [perfis],
  );
  const defaultPerfil = perfisCriacao[0]?.nome ?? 'Assistente';
  const [form, setForm] = useState<Omit<Utilizador, 'id'>>({ nome: '', email: '', perfil: defaultPerfil, ativo: true });

  useEffect(() => {
    void perfisApi.list()
      .then((res) => setPerfis(res.data || []))
      .catch(() => setPerfis([]));
  }, []);

  const perfisFormulario = useMemo(() => {
    if (editItem && isAdminPerfilNome(editItem.perfil)) {
      return perfis.filter((p) => isAdminPerfilNome(p.nome));
    }
    if (editItem && isMedicoPerfilNome(editItem.perfil)) {
      return perfis.filter((p) => isMedicoPerfilNome(p.nome));
    }
    return perfis.filter((p) => !isAdminPerfilNome(p.nome) && !isMedicoPerfilNome(p.nome));
  }, [perfis, editItem]);

  const perfilSelectDisabled = !!editItem && (
    isAdminPerfilNome(editItem.perfil) || isMedicoPerfilNome(editItem.perfil)
  );

  const filtered = utilizadores.filter(u => u.nome.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const openNew = () => {
    setEditItem(null);
    setForm({ nome: '', email: '', perfil: defaultPerfil, ativo: true });
    setIsOpen(true);
  };
  const openEdit = (u: Utilizador) => { setEditItem(u); setForm({ nome: u.nome, email: u.email, perfil: u.perfil, ativo: u.ativo }); setIsOpen(true); };
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateUtilizador(editItem.id, form);
        toast.success('Utilizador atualizado!');
      } else {
        await addUtilizador(form);
        toast.success('Utilizador criado! O utilizador deve aceder a Recuperar Password no login para definir a password.');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível guardar o utilizador.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Eliminar utilizador ${nome}?`)) return;
    try {
      await deleteUtilizador(id);
      toast.success('Utilizador eliminado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar o utilizador.');
    }
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar utilizadores..."
        searchName="search-utilizadores"
        action={canCreate ? (
          <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}>
            <Plus className="w-4 h-4" /> Novo Utilizador
          </button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>
                {['Nome', 'Email', 'Perfil', 'Estado', 'Ações'].map(h => (
                  <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
                ))}
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map(u => (
                <tr key={u.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={u.nome}
                        avatarUrl={u.avatar_url}
                        fallback={u.perfil.slice(0, 2).toUpperCase()}
                        size="xs"
                      />
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.perfil} map={perfilBadgeMap} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.ativo ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => openEdit(u)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && !isAdminPerfilNome(u.perfil) && <button type="button" onClick={() => void handleDelete(u.id, u.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
      {(canCreate || canUpdate) && isOpen && (
        <Modal title={editItem ? 'Editar Utilizador' : 'Novo Utilizador'} onClose={() => setIsOpen(false)}>
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            {!editItem && (
              <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300" style={{ fontSize: '12px' }}>
                A password não é definida aqui. Após criar a conta, o utilizador deve aceder a <strong>Recuperar Password</strong> no login, introduzir o email e definir a primeira password com o token recebido.
                {' '}Contas com perfil <strong>Médico</strong> são criadas em <strong>Administração → Médicos</strong>.
              </p>
            )}
            <Field label="Nome" required><input required type="text" name="utilizador-nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Ex.: João Silva" style={{ fontSize: '14px' }} /></Field>
            <Field label="Email" required><input required type="email" name="utilizador-email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="nome@empresa.pt" style={{ fontSize: '14px' }} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Perfil">
                <select
                  name="utilizador-perfil"
                  value={form.perfil}
                  onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                  className={inputClass}
                  style={{ fontSize: '14px' }}
                  disabled={perfilSelectDisabled}
                >
                  {perfisFormulario.length === 0 ? (
                    <option value={form.perfil}>{form.perfil}</option>
                  ) : (
                    perfisFormulario.map((perfil) => (
                      <option key={perfil.id} value={perfil.nome}>{perfil.nome}</option>
                    ))
                  )}
                </select>
                {perfilSelectDisabled && isMedicoPerfilNome(editItem?.perfil) && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                    Edite médicos em Administração → Médicos.
                  </p>
                )}
              </Field>
              <Field label="Estado">
                <select name="utilizador-estado" value={form.ativo ? 'ativo' : 'inativo'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === 'ativo' }))} className={inputClass} style={{ fontSize: '14px' }}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </Field>
            </div>
            <ModalFooter onClose={() => setIsOpen(false)} isEdit={!!editItem} saving={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========== EMPRESAS =========== */
function EmpresasTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const { empresas, addEmpresa, updateEmpresa, deleteEmpresa } = useData();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<Empresa | null>(null);
  const [form, setForm] = useState<Omit<Empresa, 'id'>>({ nome: '', morada: '', codigo_postal: '', contacto: '', email: '', nif: '', ativo: true });
  const [saving, setSaving] = useState(false);
  const { handleCodigoPostalChange, autofillFromCp } = useMemo(
    () => createPostalCodeAutofillHandlers(setForm, { fillDistrito: false, fillCidade: false, fillPais: true }),
    [],
  );

  const filtered = empresas.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()));
  const openNew = () => { setEditItem(null); setForm({ nome: '', morada: '', codigo_postal: '', contacto: '', email: '', nif: '', ativo: true }); setIsOpen(true); };
  const openEdit = (e: Empresa) => { setEditItem(e); setForm({ nome: e.nome, morada: e.morada, codigo_postal: e.codigo_postal || '', contacto: e.contacto, email: e.email, nif: e.nif, pais: e.pais || '', ativo: e.ativo !== false }); setIsOpen(true); };
  const handleSave = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editItem) { await updateEmpresa(editItem.id, form); toast.success('Empresa atualizada!'); }
      else { await addEmpresa(form); toast.success('Empresa criada!'); }
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível guardar a empresa.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Eliminar ${nome}?`)) return;
    try {
      await deleteEmpresa(id);
      toast.success('Empresa eliminada.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar a empresa.');
    }
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar empresas..."
        searchName="search-empresas"
        action={canCreate ? (
          <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> Nova Empresa</button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>{['Nome', 'NIF', 'Morada', 'Contacto', 'Email', 'Estado', 'Ações'].map(h => (
                <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
              ))}</tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map(e => (
                <tr key={e.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{e.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{e.nif}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 max-w-[200px]">{e.morada}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{e.contacto}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{e.email}</td>
                  <td className="px-4 py-3"><AtivoBadge ativo={e.ativo !== false} /></td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => openEdit(e)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(e.id, e.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
      {(canCreate || canUpdate) && isOpen && (
        <Modal title={editItem ? 'Editar Empresa' : 'Nova Empresa'} onClose={() => setIsOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nome" required><input required type="text" name="empresa-nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Ex.: Genoma" style={{ fontSize: '14px' }} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIF"><input type="text" name="empresa-nif" value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} className={inputClass} placeholder="123456789" style={{ fontSize: '14px', fontFamily: 'monospace' }} /></Field>
              <Field label="Contacto"><input type="text" name="empresa-contacto" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} className={inputClass} placeholder="912 345 678" style={{ fontSize: '14px' }} /></Field>
            </div>
            <Field label="Email"><input type="email" name="empresa-email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="contacto@empresa.pt" style={{ fontSize: '14px' }} /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Código Postal"><input type="text" name="empresa-cp" value={form.codigo_postal || ''} onChange={e => handleCodigoPostalChange(e.target.value)} onBlur={e => void autofillFromCp(e.target.value)} placeholder="0000-000" className={inputClass} style={{ fontSize: '14px' }} /></Field>
              <div className="col-span-2"><Field label="Morada"><input type="text" name="empresa-morada" value={form.morada} onChange={e => setForm(f => ({ ...f, morada: e.target.value }))} className={inputClass} placeholder="Endereço completo" style={{ fontSize: '14px' }} /></Field></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.ativo !== false} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-teal-600" />
              <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>Ativo</span>
            </label>
            <ModalFooter onClose={() => setIsOpen(false)} isEdit={!!editItem} saving={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========== TESTES =========== */
function TestesTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const { testes, deleteTeste } = useData();
  const [search, setSearch] = useState('');

  const filtered = getTestesPrincipais(testes).filter(t => t.nome.toLowerCase().includes(search.toLowerCase()) || (t.descricao || '').toLowerCase().includes(search.toLowerCase()));
  const openNew = () => navigate('/definicoes/testes/novo');
  const openEdit = (t: Teste) => navigate(`/definicoes/testes/${t.id}/editar`);
  const handleDelete = (id: string, nome: string) => {
    if (confirm(`Eliminar teste ${nome}?`)) { deleteTeste(id); toast.success('Teste eliminado.'); }
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar testes..."
        searchName="search-testes"
        action={canCreate ? (
          <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> Novo Teste</button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>{['Nome', 'Descrição', 'Preços (sub-testes)', 'Ações'].map(h => (
                <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
              ))}</tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map(t => (
                <tr key={t.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{t.nome}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 max-w-[250px]">{t.descricao}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">{formatSubTestesResumo(t)}</td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => openEdit(t)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(t.id, t.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
    </div>
  );
}

/* =========== TIPOS DE KIT =========== */
function TiposKitTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const { tiposKit, addTipoKit, updateTipoKit, deleteTipoKit } = useData();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<TipoKit | null>(null);
  const [form, setForm] = useState<Omit<TipoKit, 'id'>>({ nome: '', ativo: true });

  const filtered = tiposKit.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()));
  const openNew = () => { setEditItem(null); setForm({ nome: '', ativo: true }); setIsOpen(true); };
  const openEdit = (t: TipoKit) => { setEditItem(t); setForm({ nome: t.nome, ativo: t.ativo !== false }); setIsOpen(true); };
  const handleSave = async (ev: FormEvent) => {
    ev.preventDefault();
    try {
      if (editItem) { await updateTipoKit(editItem.id, form); toast.success('Tipo de kit atualizado!'); }
      else { await addTipoKit(form); toast.success('Tipo de kit criado!'); }
      setIsOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao guardar tipo de kit.'); }
  };
  const handleDelete = (id: string, nome: string) => {
    if (!confirm(`Eliminar tipo de kit ${nome}?`)) return;
    void deleteTipoKit(id)
      .then(() => toast.success('Tipo de kit eliminado.'))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao eliminar tipo de kit.'));
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar tipos de kit..."
        searchName="search-tipos-kit"
        action={canCreate ? (
          <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> Novo Tipo de Kit</button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>{['Nome', 'Estado', 'Ações'].map((h) => (
                <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
              ))}</tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map((t) => (
                <tr key={t.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{t.nome}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.ativo !== false ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => openEdit(t)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(t.id, t.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
      {(canCreate || canUpdate) && isOpen && (
        <Modal title={editItem ? 'Editar Tipo de Kit' : 'Novo Tipo de Kit'} onClose={() => setIsOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nome" required>
              <input required type="text" name="tipo-kit-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Maternity" style={{ fontSize: '14px' }} />
            </Field>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
              <input type="checkbox" checked={form.ativo !== false} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} /> Ativo
            </label>
            <ModalFooter onClose={() => setIsOpen(false)} isEdit={!!editItem} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function EntidadesTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const { entidades, deleteEntidade } = useData();
  const [search, setSearch] = useState('');

  const filtered = entidades.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()) || (e.cidade || '').toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Eliminar entidade ${nome}?`)) return;
    try { await deleteEntidade(id); toast.success('Entidade eliminada.'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar a entidade.'); }
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar entidades..."
        searchName="search-entidades"
        action={canCreate ? (
          <button type="button" onClick={() => navigate('/definicoes/entidades/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> Nova Entidade</button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>{['Nome', 'Cidade', 'Contacto', 'Estado', 'Ações'].map(h => (
                <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
              ))}</tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map(e => (
                <tr key={e.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{e.nome}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{e.cidade}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{e.contacto}</td>
                  <td className="px-4 py-3"><AtivoBadge ativo={e.ativo !== false} /></td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => navigate(`/definicoes/entidades/${e.id}/editar`)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(e.id, e.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
    </div>
  );
}

function LaboratoriosTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const { laboratorios, deleteLaboratorio } = useData();
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();
  const matches = (l: { nome: string }) => l.nome.toLowerCase().includes(q);

  const operacionais = laboratorios.filter((l) => l.tipo !== 'final' && matches(l));
  const finais = laboratorios.filter((l) => l.tipo === 'final' && matches(l));

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Eliminar laboratório ${nome}?`)) return;
    try { await deleteLaboratorio(id); toast.success('Laboratório eliminado.'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar o laboratório.'); }
  };

  const renderTable = (items: typeof laboratorios, { showTipo = false, showCidade = true } = {}) => {
    const headers = ['Nome', ...(showTipo ? ['Tipo'] : []), ...(showCidade ? ['Cidade'] : []), 'Contacto', 'Estado', 'Ações'];
    return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className={ADMIN_TABLE_HEAD_CLASS}>
          <tr>{headers.map(h => (
            <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
          ))}</tr>
        </thead>
        <tbody className={ADMIN_TABLE_BODY_CLASS}>
          {items.map(l => (
            <tr key={l.id} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{l.nome}</td>
              {showTipo && (
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${l.tipo === 'final' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'}`}>
                    {l.tipo === 'final' ? 'Final' : 'Operacional'}
                  </span>
                </td>
              )}
              {showCidade && (
                <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{l.cidade || '—'}</td>
              )}
              <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{l.contacto || '—'}</td>
              <td className="px-4 py-3"><AtivoBadge ativo={l.ativo !== false} /></td>
              <td className="px-4 py-3">
                <AdminRowActions>
                  {canUpdate && <button type="button" onClick={() => navigate(`/definicoes/laboratorios/${l.id}/editar`)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                  {canDelete && <button type="button" onClick={() => handleDelete(l.id, l.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
                </AdminRowActions>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar laboratórios..."
        searchName="search-laboratorios"
        action={canCreate ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/definicoes/laboratorios/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> Laboratório operacional</button>
            <button type="button" onClick={() => navigate('/definicoes/laboratorios/final/novo')} className={`${ADD_ACTION_BUTTON_CLASS} bg-indigo-600 hover:bg-indigo-700`}><Plus className="w-4 h-4" /> Laboratório final</button>
          </div>
        ) : undefined}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 px-1">Operacionais (com postos)</h3>
        <AdminTabPanel>
          {operacionais.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sem laboratórios operacionais.</p>
          ) : renderTable(operacionais, { showCidade: false })}
        </AdminTabPanel>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 px-1">Finais (destino de descarte — associar a cada teste)</h3>
        <AdminTabPanel>
          {finais.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sem laboratórios finais. Crie um e associe-o em Administração → Testes.</p>
          ) : renderTable(finais, { showTipo: true, showCidade: true })}
        </AdminTabPanel>
      </div>
    </div>
  );
}

/* =========== SHARED COMPONENTS =========== */
function AtivoBadge({ ativo }: { ativo: boolean }) {
  return <StatusBadge status={ativo ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '17px', fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={{ fontSize: '13px' }}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, isEdit, saving }: { onClose: () => void; isEdit: boolean; saving?: boolean }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" style={{ fontSize: '14px' }}>Cancelar</button>
      <button type="submit" disabled={saving} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={{ fontSize: '14px', fontWeight: 500 }}>{saving ? 'A guardar…' : (isEdit ? 'Guardar' : 'Criar')}</button>
    </div>
  );
}
