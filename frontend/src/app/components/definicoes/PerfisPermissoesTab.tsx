import { Fragment, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Edit, Loader2, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { perfisApi, Perfil } from '../../../lib/api-perfis';
import { isAdminPerfilNome } from '../../../lib/perfil-utils';
import { createAdminPermissionBundle, PerfilPermissionBundle } from '../../../lib/perfil-permissions';
import {
  DefinicoesSubmodule,
  DEFINICOES_SUBMODULES,
  ListingsSubmodule,
  LISTINGS_SUBMODULES,
  PermissionAction,
  PermissionModule,
  StockSubmodule,
  STOCK_SUBMODULES,
} from '../../../lib/permissions';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { FORM } from '../../../lib/design-tokens';
import { AppModal, ModalActions, ModalField, MODAL_INPUT_CLASS } from '../shared/AppModal';
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

type ViewMode = 'list' | 'edit';

export function PerfisPermissoesTab() {
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
    if (!confirm(`Eliminar o perfil "${perfil.nome}"?`)) return;
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
            <Plus className="w-4 h-4" /> Inserir novo
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
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

  const moduleLabels: Record<PermissionModule, string> = {
    dashboard: 'Dashboard',
    contactos: 'Contactos',
    processos: 'Processos',
    stocks: 'Stocks',
    listagens: 'Listagens',
    definicoes: 'Administração',
  };

  const actionLabels: Record<PermissionAction, string> = {
    read: 'Ler',
    create: 'Inserir',
    update: 'Editar',
    delete: 'Apagar',
  };

  const stockSubmoduleLabels: Record<StockSubmodule, string> = {
    lotes: 'Lotes',
    requisicoes: 'Envios',
    descartes: 'Descarte / Lab final',
  };

  const listingsSubmoduleLabels: Record<ListingsSubmodule, string> = {
    exames: 'Exames / Resultados',
    processos: 'Todos os Processos',
  };

  const definicoesSubmoduleLabels: Record<DefinicoesSubmodule, string> = {
    utilizadores: 'Utilizadores',
    permissoes: 'Perfis e Permissões',
    empresas: 'Empresas',
    testes: 'Testes',
    tipos_kit: 'Tipos de Kit',
    entidades: 'Entidades',
    laboratorios: 'Laboratórios',
    medicos: 'Médicos',
    motivos_anulacao: 'Motivos de anulação',
  };

  const orderedModules: PermissionModule[] = ['dashboard', 'contactos', 'processos', 'stocks', 'listagens', 'definicoes'];
  const orderedActions: PermissionAction[] = ['read', 'create', 'update', 'delete'];

  const moduleSubmodules: Partial<Record<PermissionModule, string[]>> = {
    stocks: STOCK_SUBMODULES,
    listagens: LISTINGS_SUBMODULES,
    definicoes: DEFINICOES_SUBMODULES,
  };

  const getSubmoduleLabel = (module: PermissionModule, submodule: string) => {
    if (module === 'stocks') return stockSubmoduleLabels[submodule as StockSubmodule];
    if (module === 'listagens') return listingsSubmoduleLabels[submodule as ListingsSubmodule];
    if (module === 'definicoes') return definicoesSubmoduleLabels[submodule as DefinicoesSubmodule];
    return submodule;
  };

  const getSubmoduleChecked = (module: PermissionModule, submodule: string) => {
    if (module === 'stocks') return bundle.stock[submodule as StockSubmodule];
    if (module === 'listagens') return bundle.listings[submodule as ListingsSubmodule];
    if (module === 'definicoes') return bundle.definicoes[submodule as DefinicoesSubmodule];
    return false;
  };

  const handleToggleSubmodule = (module: PermissionModule, submodule: string, checked: boolean) => {
    if (isAdmin) return;
    if (module === 'stocks') onToggleStock(submodule as StockSubmodule, checked);
    if (module === 'listagens') onToggleListings(submodule as ListingsSubmodule, checked);
    if (module === 'definicoes') onToggleDefinicoes(submodule as DefinicoesSubmodule, checked);
  };

  const handleToggle = (module: PermissionModule, action: PermissionAction, checked: boolean) => {
    if (isAdmin) return;
    onToggleModule(module, action, checked);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" style={{ fontSize: '13px', fontWeight: 500 }}>
        <ArrowLeft className="w-4 h-4" /> Voltar à lista
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '15px', fontWeight: 600 }}>Editar perfil</h3>
        <div>
          <label className="block mb-1.5 text-gray-600 dark:text-gray-400" style={{ fontSize: '13px' }}>Nome</label>
          <input
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            disabled={isAdmin}
            className={`${FORM_INPUT_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
            style={{ fontSize: '14px' }}
          />
        </div>

        {isAdmin && (
          <div className="rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-900/10 px-3 py-2">
            <p className="text-amber-800 dark:text-amber-300" style={{ fontSize: '12px', fontWeight: 500 }}>
              O perfil Administrador está protegido e não permite alterações de permissões.
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3 text-left"><span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Módulo</span></th>
                {orderedActions.map((action) => (
                  <th key={action} className="px-5 py-3 text-center">
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{actionLabels[action]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orderedModules.map((module) => {
                const modulePermissions = bundle.modules[module];
                const canReadModule = modulePermissions.read;
                const submodules = moduleSubmodules[module] ?? [];

                return (
                  <Fragment key={module}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-5 py-3.5 text-gray-900 dark:text-gray-100" style={{ fontSize: '13px', fontWeight: 500 }}>{moduleLabels[module]}</td>
                      {orderedActions.map((action) => {
                        const checked = modulePermissions[action];
                        const disabled = isAdmin || (!canReadModule && action !== 'read');
                        return (
                          <td key={action} className="px-5 py-3.5 text-center">
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => handleToggle(module, action, e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed" />
                          </td>
                        );
                      })}
                    </tr>
                    {submodules.map((submodule) => {
                      const checked = getSubmoduleChecked(module, submodule);
                      const disabled = isAdmin || !canReadModule;
                      return (
                        <tr key={`${module}-${submodule}`} className="bg-gray-50/60 dark:bg-gray-800/40">
                          <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2 pl-3">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400/80" />
                              <span style={{ fontSize: '12px', fontWeight: 500 }}>{getSubmoduleLabel(module, submodule)}</span>
                            </div>
                          </td>
                          {orderedActions.map((action) => (
                            <td key={action} className="px-5 py-2.5 text-center">
                              {action === 'read' ? (
                                <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => handleToggleSubmodule(module, submodule, e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed" />
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600" style={{ fontSize: '12px' }}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onRefresh} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300" style={{ fontSize: '13px' }}>
            Sincronizar stocks
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60" style={{ fontSize: '13px', fontWeight: 600 }}>
            {saving ? 'A guardar…' : 'Gravar'}
          </button>
        </div>
      </div>
    </div>
  );
}
