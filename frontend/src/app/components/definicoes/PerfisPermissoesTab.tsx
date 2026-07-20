import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Edit, Loader2, Plus, RefreshCw, Save, Shield, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { perfisApi, Perfil } from '../../../lib/api-perfis';
import { isAdminPerfilNome } from '../../../lib/perfil-utils';
import { createAdminPermissionBundle, PerfilPermissionBundle } from '../../../lib/perfil-permissions';
import {
  DefinicoesSubmodule,
  ListingsSubmodule,
  PermissionAction,
  PermissionModule,
  StockSubmodule,
} from '../../../lib/permissions';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { useLanguage } from '../../../i18n/LanguageContext';
import { CONTROL, FORM, SURFACE } from '../../../lib/design-tokens';
import { AppModal, ModalActions, ModalAlert, ModalField, MODAL_INPUT_CLASS } from '../shared/AppModal';
import { FormPageHeader, FormPrimaryButton } from '../shared/FormPageChrome';
import { PermissionsMatrix } from './PermissionsMatrix';
import {
  ADMIN_ACTION_BTN_CLASS,
  ADMIN_DELETE_BTN_CLASS,
  ADMIN_TABLE_BODY_CLASS,
  ADMIN_TABLE_HEAD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminRowActions,
  AdminTabPanel,
  AdminTabToolbar,
  AdminTableHeadCell,
} from './admin-tab-ui';
import { deleteTargetLabel } from '../../../lib/confirm-delete';
import { useConfirmDelete } from '../../context/ConfirmDeleteContext';

type ViewMode = 'list' | 'edit';

export function PerfisPermissoesTab() {
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const {
    stockPermissionsSyncStatus,
    refreshStockPermissionsFromBackend,
    getPerfilPermissionBundle,
    updatePerfilModulePermission,
    updatePerfilStockSubmodulePermission,
    updatePerfilListingsSubmodulePermission,
    updatePerfilDefinicoesSubmodulePermission,
    initPermissionsForPerfil,
    removePermissionsForPerfil,
  } = useAuth();

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);
  const [editNome, setEditNome] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPerfis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await perfisApi.list();
      const sorted = [...(res.data || [])].sort((a, b) => {
        if (isAdminPerfilNome(a.nome)) return -1;
        if (isAdminPerfilNome(b.nome)) return 1;
        return a.nome.localeCompare(b.nome, 'pt');
      });
      setPerfis(sorted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar os perfis.');
      setPerfis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPerfis();
  }, [loadPerfis]);

  const openEdit = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setEditNome(perfil.nome);
    setView('edit');
  };

  const backToList = () => {
    setView('list');
    setSelectedPerfil(null);
    setEditNome('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = newNome.trim();
    if (!nome) return;
    setSaving(true);
    try {
      const res = await perfisApi.create(nome);
      initPermissionsForPerfil(res.data.id);
      await loadPerfis();
      setCreateOpen(false);
      setNewNome('');
      toast.success('Perfil criado.');
      openEdit(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (perfil: Perfil) => {
    if (isAdminPerfilNome(perfil.nome)) return;
    if (!(await confirmDelete(deleteTargetLabel('o perfil', perfil.nome)))) return;
    try {
      await perfisApi.delete(perfil.id);
      removePermissionsForPerfil(perfil.id);
      await loadPerfis();
      toast.success('Perfil eliminado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar o perfil.');
    }
  };

  const handleSave = async () => {
    if (!selectedPerfil) return;
    const isAdmin = isAdminPerfilNome(selectedPerfil.nome);
    if (isAdmin) {
      backToList();
      return;
    }
    const nome = editNome.trim();
    if (!nome) {
      toast.error('O nome do perfil é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      if (nome !== selectedPerfil.nome) {
        await perfisApi.update(selectedPerfil.id, nome);
        await loadPerfis();
      }
      toast.success('Perfil guardado.');
      backToList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível guardar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (view === 'edit' && selectedPerfil) {
    return (
      <PerfilEditor
        perfil={selectedPerfil}
        nome={editNome}
        onNomeChange={setEditNome}
        onBack={backToList}
        onSave={() => void handleSave()}
        saving={saving}
        bundle={isAdminPerfilNome(selectedPerfil.nome) ? createAdminPermissionBundle() : getPerfilPermissionBundle(selectedPerfil.id)}
        onRefresh={() => void refreshStockPermissionsFromBackend()}
        onToggleModule={(module, action, value) => updatePerfilModulePermission(selectedPerfil.id, module, action, value)}
        onToggleStock={(submodule, value) => updatePerfilStockSubmodulePermission(selectedPerfil.id, submodule, value)}
        onToggleListings={(submodule, value) => updatePerfilListingsSubmodulePermission(selectedPerfil.id, submodule, value)}
        onToggleDefinicoes={(submodule, value) => updatePerfilDefinicoesSubmodulePermission(selectedPerfil.id, submodule, value)}
      />
    );
  }

  const filteredPerfis = perfis.filter((perfil) => {
    const q = search.trim().toLowerCase();
    return !q || perfil.nome.toLowerCase().includes(q);
  });

  const syncUi = stockPermissionsSyncStatus === 'synced'
    ? { icon: CheckCircle, text: 'Sincronizado com backend', className: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' }
    : stockPermissionsSyncStatus === 'syncing'
      ? { icon: Loader2, text: 'A sincronizar permissões...', className: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' }
      : { icon: XCircle, text: 'Fallback local ativo (sem sincronização remota)', className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' };
  const SyncIcon = syncUi.icon;

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar perfis..."
        searchName="search-perfis"
        action={
          <button type="button" onClick={() => setCreateOpen(true)} className={ADD_ACTION_BUTTON_CLASS}>
            <Plus className="w-4 h-4" /> {t('common.create.insertNew')}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 flex-1 ${syncUi.className}`}>
          <SyncIcon className={`w-4 h-4 ${stockPermissionsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{syncUi.text}</span>
        </div>
        <button
          type="button"
          onClick={() => void refreshStockPermissionsFromBackend()}
          className={CONTROL.buttonSecondary}
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          <RefreshCw className="w-4 h-4" /> Sincronizar
        </button>
      </div>

      <AdminTabPanel>
        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar perfis…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={ADMIN_TABLE_HEAD_CLASS}>
                <tr>
                  {['Nome', 'Ações'].map((h) => (
                    <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>
                      {h}
                    </AdminTableHeadCell>
                  ))}
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_BODY_CLASS}>
                {filteredPerfis.map((perfil) => {
                  const isAdmin = isAdminPerfilNome(perfil.nome);
                  return (
                    <tr key={perfil.id} className={ADMIN_TABLE_ROW_CLASS}>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{perfil.nome}</td>
                      <td className="px-4 py-3">
                        <AdminRowActions>
                          <button type="button" onClick={() => openEdit(perfil)} className={ADMIN_ACTION_BTN_CLASS} title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isAdmin && (
                            <button type="button" onClick={() => void handleDelete(perfil)} className={ADMIN_DELETE_BTN_CLASS} title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </AdminRowActions>
                      </td>
                    </tr>
                  );
                })}
                {filteredPerfis.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-slate-400 text-[13px]">
                      Sem perfis registados. Crie o primeiro perfil abaixo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminTabPanel>

      {createOpen && (
        <AppModal
          title="Novo perfil"
          onClose={() => { setCreateOpen(false); setNewNome(''); }}
          footer={(
            <ModalActions
              onCancel={() => { setCreateOpen(false); setNewNome(''); }}
              submitLabel={saving ? 'A criar…' : 'Criar'}
              formId="novo-perfil-form"
              saving={saving}
            />
          )}
        >
          <form id="novo-perfil-form" onSubmit={(e) => void handleCreate(e)} className={FORM.stack}>
            <ModalField label="Nome" required>
              <input
                required
                autoFocus
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                className={MODAL_INPUT_CLASS}
                placeholder="Ex.: Telemarketing"
              />
            </ModalField>
          </form>
        </AppModal>
      )}
    </div>
  );
}

function PerfilEditor({
  perfil, nome, onNomeChange, onBack, onSave, saving, bundle, onRefresh,
  onToggleModule, onToggleStock, onToggleListings, onToggleDefinicoes,
}: {
  perfil: Perfil;
  nome: string;
  onNomeChange: (v: string) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  bundle: PerfilPermissionBundle;
  onRefresh: () => void;
  onToggleModule: (module: PermissionModule, action: PermissionAction, value: boolean) => void;
  onToggleStock: (submodule: StockSubmodule, value: boolean) => void;
  onToggleListings: (submodule: ListingsSubmodule, value: boolean) => void;
  onToggleDefinicoes: (submodule: DefinicoesSubmodule, value: boolean) => void;
}) {
  const isAdmin = isAdminPerfilNome(perfil.nome);

  return (
    <div className="space-y-5">
      <FormPageHeader
        onBack={onBack}
        title={nome.trim() || perfil.nome}
        subtitle="Permissões de módulos e sub-módulos do CRM"
        actions={(
          <>
            <button
              type="button"
              onClick={onRefresh}
              className={CONTROL.buttonSecondary}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Sincronizar stocks</span>
            </button>
            <FormPrimaryButton onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A guardar…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </FormPrimaryButton>
          </>
        )}
      />

      <div className={`${SURFACE.cardElevated} p-5 md:p-6 space-y-5`}>
        <div className="max-w-md">
          <label className={FORM.label}>Nome do perfil</label>
          <input
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            disabled={isAdmin}
            className={`${MODAL_INPUT_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
            placeholder="Ex.: Assistente"
          />
        </div>

        {isAdmin && (
          <ModalAlert tone="warning">
            O perfil Administrador está protegido e não permite alterações de permissões.
          </ModalAlert>
        )}

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Matriz de permissões</h3>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Clique nas células para ativar ou desativar
            </p>
          </div>

          <PermissionsMatrix
            bundle={bundle}
            readOnly={isAdmin}
            onToggleModule={onToggleModule}
            onToggleStock={onToggleStock}
            onToggleListings={onToggleListings}
            onToggleDefinicoes={onToggleDefinicoes}
          />
        </div>
      </div>
    </div>
  );
}
