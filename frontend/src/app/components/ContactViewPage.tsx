import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { PAGE } from '../../lib/design-tokens';
import { parseTabParam, CONTACT_TAB_IDS, withRecordQuery, type ContactTabId } from '../../lib/record-tabs';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ContactDetail } from './ContactDetail';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { notifyError, notifySuccess } from '../../lib/toast';
import { contactTemProcessoAtivo, findProcessoDoContacto } from '../../lib/contactos';
import { navigateToProcessoFromContact } from '../../lib/contact-processo-redirect';
import { ContactFormEditHandle } from './ContactFormPage';

export function ContactViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();
  const { contacts, deleteContact, processos } = useData();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('contactos', 'update');
  const canDelete = hasPermission('contactos', 'delete');
  const editRef = useRef<ContactFormEditHandle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const contact = id ? contacts.find((c) => c.id === id) : undefined;
  const tab = parseTabParam(searchParams.get('tab'), CONTACT_TAB_IDS, 'identificacao');
  const editParam = searchParams.get('edit') === '1';

  useEffect(() => {
    if (!id || !contactTemProcessoAtivo(id, processos)) return;
    const proc = findProcessoDoContacto(id, processos);
    if (!proc) return;
    navigateToProcessoFromContact(navigate, proc.id, { replace: true });
  }, [id, processos, navigate]);

  useEffect(() => {
    if (editParam && canUpdate && contact) setIsEditing(true);
  }, [editParam, canUpdate, contact?.id]);

  const setEditParam = useCallback((enabled: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (enabled) next.set('edit', '1');
      else next.delete('edit');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleTabChange = (next: ContactTabId) => {
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
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    editRef.current?.cancel();
    setEditParam(false);
    setIsEditing(false);
  };

  const handleSaveComplete = () => {
    setEditParam(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await editRef.current?.save();
      if (ok) handleSaveComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact || !canDelete) return;
    if (!(await confirmDelete(deleteTargetLabel('o contacto', contact.nome)))) return;
    try {
      await deleteContact(contact.id);
      notifySuccess('Contacto eliminado.');
      navigate('/contactos');
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    }
  };

  if (!id || !contact) {
    return (
      <div className={`flex flex-col min-h-full ${PAGE.shell} p-6`} style={{ fontFamily: 'Inter, sans-serif' }}>
        <button onClick={() => navigate('/contactos')} className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar aos contactos
        </button>
        <p className="text-slate-500 dark:text-slate-400">Contacto não encontrado.</p>
      </div>
    );
  }

  return (
    <ContactDetail
      contact={contact}
      activeTab={tab}
      onTabChange={handleTabChange}
      onBack={() => {
        if (isEditing) handleCancelEdit();
        else navigate('/contactos');
      }}
      onEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSave={() => { void handleSave(); }}
      onDelete={() => { void handleDelete(); }}
      canUpdate={canUpdate}
      canDelete={canDelete}
      isEditing={isEditing}
      saving={saving}
      editRef={editRef}
      onSaveComplete={handleSaveComplete}
    />
  );
}
