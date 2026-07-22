import React, { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, X, Users, Building2, FlaskConical, ShieldCheck, Package, Stethoscope, Ban, Landmark, LayoutGrid, Settings2, type LucideIcon } from 'lucide-react';
import { PerfisPermissoesTab } from './definicoes/PerfisPermissoesTab';
import { SistemaTab } from './definicoes/SistemaTab';
import { AdminModuleCards, type AdminModuleCardDef, type AdminModuleCardId } from './definicoes/AdminModuleCards';
import { MedicosTab } from './MedicosTab';
import { MotivosAnulacaoTab } from './MotivosAnulacaoTab';
import { useData } from '../context/DataContext';
import { Utilizador } from '../data/types';
import { toast } from 'sonner';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { StatusBadge } from './shared/StatusBadge';
import { UserAvatar } from './shared/UserAvatar';
import { PAGE, FORM } from '../../lib/design-tokens';
import { AdminModuleHeader } from './definicoes/AdminModuleHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppModal, ModalActions, ModalAlert, ModalCheckbox, ModalField, MODAL_INPUT_CLASS } from './shared/AppModal';
import { ReadOnlyNotice } from './shared/ReadOnlyNotice';
import { AccessDeniedState } from './shared/AccessDeniedState';
import { DefinicoesSubmodule } from '../../lib/permissions';
import { perfisApi, Perfil } from '../../lib/api-perfis';
import { isAdminPerfilNome, isMedicoPerfilNome } from '../../lib/perfil-utils';
import { formatUtilizadorNome } from '../../lib/utilizadores';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { getTestesPrincipais } from '../../lib/testes';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useSearchParams } from 'react-router';
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

type Tab = 'inicio' | 'utilizadores' | 'permissoes' | 'empresas' | 'tipos_kit' | 'entidades' | 'laboratorios' | 'medicos' | 'motivos_anulacao' | 'sistema';

const SETTINGS_TABS: Tab[] = ['inicio', 'utilizadores', 'permissoes', 'empresas', 'tipos_kit', 'entidades', 'laboratorios', 'medicos', 'motivos_anulacao', 'sistema'];
const SETTINGS_CONTENT_TABS = SETTINGS_TABS.filter((tab): tab is Exclude<Tab, 'inicio'> => tab !== 'inicio');

const getValidSettingsTab = (tab: string | null, isAdmin: boolean, allowedTabs: Exclude<Tab, 'inicio'>[]): Tab => {
  if (tab === 'testes') {
    tab = 'tipos_kit';
  }

  if (!tab || tab === 'inicio') {
    return 'inicio';
  }

  if (!SETTINGS_TABS.includes(tab as Tab)) {
    return 'inicio';
  }

  if (!isAdmin && tab === 'permissoes') {
    return 'inicio';
  }

  if (!isAdmin && tab === 'sistema') {
    return 'inicio';
  }

  if (!allowedTabs.includes(tab as Exclude<Tab, 'inicio'>)) {
    return 'inicio';
  }

  return tab as Tab;
};

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
  const {
    utilizadores,
    empresas,
    tiposKit,
    entidades,
    laboratorios,
    motivosAnulacao,
  } = useData();
  const isAdmin = isAdministrator;
  const allowedSettingsTabs = useMemo(() => {
    const tabs = SETTINGS_CONTENT_TABS.filter((tab) => {
      if (tab === 'permissoes' || tab === 'sistema') {
        return isAdmin;
      }
      if (tab === 'tipos_kit') {
        return hasDefinicoesSubmodulePermission('tipos_kit') || hasDefinicoesSubmodulePermission('testes');
      }
      return hasDefinicoesSubmodulePermission(tab as DefinicoesSubmodule);
    });
    return tabs;
  }, [hasDefinicoesSubmodulePermission, isAdmin]);
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
    const expected = normalizedTab === 'inicio' ? null : normalizedTab;

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
    if (normalizedTab === 'inicio') {
      params.delete('tab');
    } else {
      params.set('tab', normalizedTab);
    }

    setSearchParams(params, { replace: true });
  };

  const moduleToneByTab: Partial<Record<AdminModuleCardId, AdminModuleCardDef['tone']>> = {
    utilizadores: 'brand',
    permissoes: 'violet',
    empresas: 'info',
    tipos_kit: 'warning',
    entidades: 'neutral',
    laboratorios: 'info',
    medicos: 'violet',
    motivos_anulacao: 'danger',
    sistema: 'brand',
  };

  const allTabs: { id: Tab; labelKey: string; icon: LucideIcon }[] = [
    { id: 'inicio', labelKey: 'navSub.inicio', icon: LayoutGrid },
    { id: 'utilizadores', labelKey: 'navSub.utilizadores', icon: Users },
    { id: 'permissoes', labelKey: 'navSub.permissoes', icon: ShieldCheck },
    { id: 'empresas', labelKey: 'navSub.empresas', icon: Building2 },
    { id: 'tipos_kit', labelKey: 'navSub.tipos_kit', icon: Package },
    { id: 'entidades', labelKey: 'navSub.entidades', icon: Landmark },
    { id: 'laboratorios', labelKey: 'navSub.laboratorios', icon: FlaskConical },
    { id: 'medicos', labelKey: 'navSub.medicos', icon: Stethoscope },
    { id: 'motivos_anulacao', labelKey: 'navSub.motivos_anulacao', icon: Ban },
    { id: 'sistema', labelKey: 'navSub.sistema', icon: Settings2 },
  ];

  const tabs = allTabs
    .filter((tab) => {
      if (tab.id === 'inicio') return true;
      if (tab.id === 'permissoes' && !isAdmin) return false;
      if (tab.id === 'sistema' && !isAdmin) return false;
      return allowedSettingsTabs.includes(tab.id as Exclude<Tab, 'inicio'>);
    })
    .map((tab) => ({ ...tab, label: t(tab.labelKey) }));

  const moduleCards = useMemo<AdminModuleCardDef[]>(() => {
    const counts: Partial<Record<AdminModuleCardId, number | undefined>> = {
      utilizadores: utilizadores.length,
      empresas: empresas.length,
      tipos_kit: tiposKit.length,
      entidades: entidades.length,
      laboratorios: laboratorios.length,
      motivos_anulacao: motivosAnulacao.length,
    };

    return allTabs
      .filter((tab) => tab.id !== 'inicio')
      .filter((tab) => {
        if (tab.id === 'permissoes' || tab.id === 'sistema') return isAdmin;
        return allowedSettingsTabs.includes(tab.id as Exclude<Tab, 'inicio'>);
      })
      .map((tab) => {
        const id = tab.id as AdminModuleCardId;
        return {
          id,
          label: t(tab.labelKey),
          description: t(`pages.admin.modules.${id}`),
          icon: tab.icon,
          tone: moduleToneByTab[id],
          ...(id === 'medicos'
            ? { countFromApi: 'medicos' as const }
            : { count: counts[id] }),
        };
      });
  }, [
    allowedSettingsTabs,
    empresas.length,
    entidades.length,
    isAdmin,
    laboratorios.length,
    motivosAnulacao.length,
    t,
    tiposKit.length,
    utilizadores.length,
  ]);

  if (!canRead) {
    return <AccessDeniedState message="O perfil atual nao tem permissao para aceder ao modulo de Administracao." />;
  }

  if (allowedSettingsTabs.length === 0) {
    return <AccessDeniedState message="O perfil atual nao tem permissao para visualizar submodulos de Administracao." />;
  }

  return (
    <div className={PAGE.shell} style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={PAGE.body}>
        <AdminModuleHeader
          title={t('pages.admin.title')}
          subtitle={t('pages.admin.subtitle')}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleChangeTab}
        />

        {!canCreate && !canUpdate && !canDelete && activeTab !== 'inicio' && (
          <ReadOnlyNotice message="Este perfil pode consultar a administracao, mas nao pode criar, editar ou eliminar registos." />
        )}

        {activeTab === 'inicio' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('pages.admin.overviewHint')}</p>
            <AdminModuleCards
              modules={moduleCards}
              onSelect={(id) => handleChangeTab(id)}
            />
          </div>
        )}
        {activeTab === 'utilizadores' && <UtilizadoresTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'permissoes' && isAdmin && <PerfisPermissoesTab />}
        {activeTab === 'empresas' && <EmpresasTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'tipos_kit' && <TiposKitTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'entidades' && <EntidadesTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'laboratorios' && <LaboratoriosTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'medicos' && <MedicosTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'motivos_anulacao' && <MotivosAnulacaoTab canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />}
        {activeTab === 'sistema' && isAdmin && <SistemaTab />}
      </div>
    </div>
  );
}

/* =========== UTILIZADORES =========== */
function UtilizadoresTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
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

  const filtered = utilizadores.filter((u) => {
    const q = search.toLowerCase();
    const label = formatUtilizadorNome(u);
    return !q || label.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const openNew = () => {
    setEditItem(null);
    setForm({ nome: '', email: '', perfil: defaultPerfil, ativo: true });
    setIsOpen(true);
  };
  const openEdit = (u: Utilizador) => {
    if (isMedicoPerfilNome(u.perfil)) {
      navigate(`/definicoes/utilizadores/${u.id}/editar`);
      return;
    }
    setEditItem(u);
    setForm({ nome: u.nome, email: u.email, perfil: u.perfil, ativo: u.ativo });
    setIsOpen(true);
  };
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
    if (!(await confirmDelete(deleteTargetLabel('o utilizador', nome)))) return;
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
            <Plus className="w-4 h-4" /> {t('common.create.user')}
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
                        name={formatUtilizadorNome(u)}
                        avatarUrl={u.avatar_url}
                        fallback={u.perfil.slice(0, 2).toUpperCase()}
                        size="xs"
                      />
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{formatUtilizadorNome(u)}</span>
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
        <AppModal
          title={editItem ? 'Editar Utilizador' : 'Novo Utilizador'}
          onClose={() => setIsOpen(false)}
          footer={<ModalActions onCancel={() => setIsOpen(false)} isEdit={!!editItem} saving={saving} formId="utilizador-form" />}
        >
          <form id="utilizador-form" onSubmit={(e) => void handleSave(e)} className={FORM.stack}>
            {!editItem && (
              <ModalAlert>
                A password não é definida aqui. Após criar a conta, o utilizador deve aceder a <strong>Recuperar Password</strong> no login, introduzir o email e definir a primeira password com o token recebido.
                {' '}Contas com perfil <strong>Médico</strong> são criadas em <strong>Administração → Médicos</strong>.
              </ModalAlert>
            )}
            <ModalField label="Nome" required>
              <input required type="text" name="utilizador-nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={MODAL_INPUT_CLASS} placeholder="Ex.: João Silva" />
            </ModalField>
            <ModalField label="Email" required>
              <input required type="email" name="utilizador-email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={MODAL_INPUT_CLASS} placeholder="nome@empresa.pt" />
            </ModalField>
            <div className="grid grid-cols-2 gap-4">
              <ModalField
                label="Perfil"
                hint={perfilSelectDisabled && isMedicoPerfilNome(editItem?.perfil) ? 'Edite médicos em Administração → Médicos.' : undefined}
              >
                <select
                  name="utilizador-perfil"
                  value={form.perfil}
                  onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                  className={MODAL_INPUT_CLASS}
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
              </ModalField>
              <ModalField label="Estado">
                <select name="utilizador-estado" value={form.ativo ? 'ativo' : 'inativo'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === 'ativo' }))} className={MODAL_INPUT_CLASS}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </ModalField>
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
}

/* =========== EMPRESAS =========== */
function EmpresasTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { empresas, deleteEmpresa } = useData();
  const [search, setSearch] = useState('');

  const filtered = empresas.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('a empresa', nome)))) return;
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
          <button type="button" onClick={() => navigate('/definicoes/empresas/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> {t('common.create.company')}</button>
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
                      {canUpdate && <button type="button" onClick={() => navigate(`/definicoes/empresas/${e.id}/editar`)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
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

/* =========== TIPOS DE KIT =========== */
function TiposKitTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { tiposKit, testes, deleteTipoKit } = useData();
  const [search, setSearch] = useState('');

  const testesPorTipoKit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const teste of getTestesPrincipais(testes)) {
      const nome = teste.tipo_kit?.trim();
      if (!nome) continue;
      counts.set(nome, (counts.get(nome) ?? 0) + 1);
    }
    return counts;
  }, [testes]);

  const filtered = tiposKit.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o tipo de kit', nome)))) return;
    void deleteTipoKit(id)
      .then(() => toast.success(t('pages.admin.form.tipoKit.deleted')))
      .catch((e) => toast.error(e instanceof Error ? e.message : t('pages.admin.form.tipoKit.deleteError')));
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar tipos de kit..."
        searchName="search-tipos-kit"
        action={canCreate ? (
          <button type="button" onClick={() => navigate('/definicoes/tipos-kit/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> {t('common.create.kitType')}</button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>{['Nome', 'Testes', 'Estado', 'Ações'].map((h) => (
                <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
              ))}</tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                    {tiposKit.length === 0 ? 'Nenhum tipo de kit registado.' : 'Nenhum resultado para a pesquisa.'}
                  </td>
                </tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{item.nome}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{testesPorTipoKit.get(item.nome) ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.ativo !== false ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && <button type="button" onClick={() => navigate(`/definicoes/tipos-kit/${item.id}/editar`)} className={ADMIN_ACTION_BTN_CLASS}><Edit className="w-4 h-4" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(item.id, item.nome)} className={ADMIN_DELETE_BTN_CLASS}><Trash2 className="w-4 h-4" /></button>}
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

function EntidadesTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { entidades, deleteEntidade } = useData();
  const [search, setSearch] = useState('');

  const filtered = entidades.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()) || (e.cidade || '').toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('a entidade', nome)))) return;
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
          <button type="button" onClick={() => navigate('/definicoes/entidades/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> {t('common.create.entity')}</button>
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
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { laboratorios, deleteLaboratorio } = useData();
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();
  const matches = (l: { nome: string }) => l.nome.toLowerCase().includes(q);

  const operacionais = laboratorios.filter((l) => l.tipo !== 'final' && matches(l));
  const finais = laboratorios.filter((l) => l.tipo === 'final' && matches(l));

  const handleDelete = async (id: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o laboratório', nome)))) return;
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
            <button type="button" onClick={() => navigate('/definicoes/laboratorios/novo')} className={ADD_ACTION_BUTTON_CLASS}><Plus className="w-4 h-4" /> {t('common.create.operationalLab')}</button>
            <button type="button" onClick={() => navigate('/definicoes/laboratorios/final/novo')} className={`${ADD_ACTION_BUTTON_CLASS} bg-indigo-600 hover:bg-indigo-700`}><Plus className="w-4 h-4" /> {t('common.create.finalLab')}</button>
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
            <p className="text-sm text-slate-400 text-center py-6">Sem laboratórios finais. Crie um e associe-o em Administração → Tipos de Kit → Testes.</p>
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
