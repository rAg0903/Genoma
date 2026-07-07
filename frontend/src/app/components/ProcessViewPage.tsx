import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { PAGE } from '../../lib/design-tokens';
import { parseTabParam, PROCESS_TAB_IDS, type ProcessTabId } from '../../lib/record-tabs';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ProcessDetail } from './ProcessDetail';
import { ContactToProcessoNotice } from './shared/ContactToProcessoNotice';
import { isContactToProcessoRedirect } from '../../lib/contact-processo-redirect';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { notifyError, notifySuccess } from '../../lib/toast';
import { useProcessRecordEdit } from './processos/useProcessRecordEdit';

export function ProcessViewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { processos, deleteProcesso, refreshProcessos } = useData();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('processos', 'update');
  const canDelete = hasPermission('processos', 'delete');
  const [showContactNotice, setShowContactNotice] = useState(() =>
    isContactToProcessoRedirect(location.state),
  );

  useEffect(() => {
    if (!isContactToProcessoRedirect(location.state)) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!id) return;
    void refreshProcessos();
  }, [id, refreshProcessos]);

  const processo = id ? processos.find((p) => p.id === id) : undefined;
  const tab = parseTabParam(searchParams.get('tab'), PROCESS_TAB_IDS, 'identificacao');
  const edit = useProcessRecordEdit(processo, canUpdate, t);

  const editParam = searchParams.get('edit') === '1';

  useEffect(() => {
    if (!editParam || !canUpdate || !processo) return;
    edit.startEdit();
  }, [editParam, canUpdate, processo?.id, edit.startEdit]);

  const setEditParam = useCallback((enabled: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (enabled) next.set('edit', '1');
      else next.delete('edit');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleTabChange = (next: ProcessTabId) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === 'identificacao') params.delete('tab');
      else params.set('tab', next);
      return params;
    }, { replace: true });
  };

  const handleStartEdit = () => {
    if (!canUpdate) return;
    setEditParam(true);
    edit.startEdit();
  };

  const handleCancelEdit = () => {
    edit.cancelEdit();
    setEditParam(false);
  };

  const handleSave = async () => {
    const ok = await edit.save();
    if (ok) setEditParam(false);
  };

  const handleDelete = async () => {
    if (!processo || !canDelete) return;
    if (!(await confirmDelete(deleteTargetLabel('o processo', processo.numero)))) return;
    try {
      await deleteProcesso(processo.id);
      notifySuccess(t('pages.processes.deleted', { numero: processo.numero }));
      navigate('/processos');
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    }
  };

  if (!id || !processo) {
    return (
      <div className={`flex flex-col min-h-full ${PAGE.shell} p-6`} style={{ fontFamily: 'Inter, sans-serif' }}>
        <button onClick={() => navigate('/processos')} className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar aos processos
        </button>
        <p className="text-slate-500 dark:text-slate-400">Processo não encontrado.</p>
      </div>
    );
  }

  return (
    <ProcessDetail
      processo={processo}
      activeTab={tab}
      onTabChange={handleTabChange}
      onBack={() => {
        if (edit.isEditing) handleCancelEdit();
        else navigate('/processos');
      }}
      onEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSave={() => { void handleSave(); }}
      onDelete={() => { void handleDelete(); }}
      canUpdate={canUpdate}
      canDelete={canDelete}
      isEditing={edit.isEditing}
      saving={edit.saving}
      edit={edit}
      topNotice={
        showContactNotice ? (
          <ContactToProcessoNotice onDismiss={() => setShowContactNotice(false)} />
        ) : undefined
      }
    />
  );
}
