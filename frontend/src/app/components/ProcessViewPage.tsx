import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ProcessDetail } from './ProcessDetail';
import { ContactToProcessoNotice } from './shared/ContactToProcessoNotice';
import { isContactToProcessoRedirect } from '../../lib/contact-processo-redirect';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';

export function ProcessViewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
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
      toast.success('Processo eliminado.');
      navigate('/processos');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao eliminar.');
    }
  };

  if (!id || !processo) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900 p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <button onClick={() => navigate('/processos')} className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar aos processos
        </button>
        <p className="text-gray-500 dark:text-gray-400">Processo não encontrado.</p>
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
