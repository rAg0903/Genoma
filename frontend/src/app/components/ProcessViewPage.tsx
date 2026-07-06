import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { PAGE } from '../../lib/design-tokens';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ProcessDetail } from './ProcessDetail';
import { ContactToProcessoNotice } from './shared/ContactToProcessoNotice';
import { isContactToProcessoRedirect } from '../../lib/contact-processo-redirect';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { notifyError, notifySuccess } from '../../lib/toast';

export function ProcessViewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { processos, deleteProcesso } = useData();
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

  const processo = id ? processos.find((p) => p.id === id) : undefined;

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
      onBack={() => navigate('/processos')}
      onEdit={() => {
        if (!canUpdate) return;
        navigate(`/processos/${processo.id}/editar`);
      }}
      onDelete={() => { void handleDelete(); }}
      canUpdate={canUpdate}
      canDelete={canDelete}
      topNotice={
        showContactNotice ? (
          <ContactToProcessoNotice onDismiss={() => setShowContactNotice(false)} />
        ) : undefined
      }
    />
  );
}
