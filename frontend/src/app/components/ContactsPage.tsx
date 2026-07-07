import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Users, UserCheck, UserPlus, LayoutGrid, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { type ContactTabId, withRecordQuery } from '../../lib/record-tabs';
import { useData } from '../context/DataContext';
import { Contact } from '../data/types';
import { ContactPipeline } from './contactos/ContactPipeline';
import { toast } from 'sonner';
import { DataTable } from './shared/DataTable';
import { PageHeader } from './shared/PageHeader';
import { FilterBar } from './shared/FilterBar';
import { ViewModeToggle } from './shared/SlidingTabs';
import { StatusBadge } from './shared/StatusBadge';
import { EmptyState } from './shared/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ReadOnlyNotice } from './shared/ReadOnlyNotice';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import {
  CONTACTO_PAGE_ESTADOS, CONTACTO_PIPELINE_LABEL, filterContactosPreProcesso, getContactoPipelineEstado,
} from '../../lib/contactos';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { formatCalendarDatePt } from '../../lib/dates';
import { KpiCard } from './dashboard/KpiCard';
import { formatNumber, LAYOUT, PAGE, PANEL, CONTROL } from '../../lib/design-tokens';

const CONTACTO_STATUS_STYLES: Record<string, string> = {
  Criado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Agendado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Cancelado: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

type ContactoFiltroEstado = typeof CONTACTO_PAGE_ESTADOS[number];

export function ContactsPage() {
  const { contacts, deleteContact, processos } = useData();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const navigate = useNavigate();
  const canCreate = hasPermission('contactos', 'create');
  const canUpdate = hasPermission('contactos', 'update');
  const canDelete = hasPermission('contactos', 'delete');
  const [searchTerm, setSearchTerm] = useState('');
  const [generoFilter, setGeneroFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<ContactoFiltroEstado | ''>('');
  const [view, setView] = useState<'table' | 'pipeline'>('pipeline');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const contactosPreProcesso = useMemo(
    () => filterContactosPreProcesso(contacts, processos),
    [contacts, processos],
  );

  const estadoChips = useMemo(() => CONTACTO_PAGE_ESTADOS.map((e) => ({
    id: e,
    label: CONTACTO_PIPELINE_LABEL[e],
    count: contactosPreProcesso.filter((c) => getContactoPipelineEstado(c) === e).length,
    tone: e === 'Cancelado' ? ('danger' as const) : e === 'Criado' ? ('neutral' as const) : ('brand' as const),
  })), [contactosPreProcesso]);

  const filtered = useMemo(() => contactosPreProcesso.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || c.nome.toLowerCase().includes(q) ||
      c.nif?.includes(searchTerm) || c.email?.toLowerCase().includes(q);
    const matchGenero = !generoFilter || c.genero === generoFilter;
    const pipelineEstado = getContactoPipelineEstado(c);
    const matchEstado = !estadoFilter || pipelineEstado === estadoFilter;
    return matchSearch && matchGenero && matchEstado;
  }), [contactosPreProcesso, searchTerm, generoFilter, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  const resetPage = () => setCurrentPage(1);

  const handleDelete = async (id: string, nome: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o contacto', nome)))) return;
    try {
      await deleteContact(id);
      toast.success('Contacto eliminado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao eliminar contacto.';
      toast.error(message);
    }
  };

  const openNew = () => navigate('/contactos/novo');
  const openView = (c: Contact) => navigate(`/contactos/${c.id}`);
  const openEdit = (c: Contact, tab?: ContactTabId) => {
    navigate(withRecordQuery(`/contactos/${c.id}`, { tab, edit: true }));
  };

  const novosEsteMes = contactosPreProcesso.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const agendados = contactosPreProcesso.filter((c) => getContactoPipelineEstado(c) === 'Agendado').length;

  const contactColumns = [
    {
      key: 'nome',
      header: 'Nome',
      render: (contact: Contact) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 dark:text-blue-400" style={{ fontSize: '11px', fontWeight: 600 }}>
              {contact.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </span>
          </div>
          <span className="text-slate-800 dark:text-slate-100 font-medium">{contact.nome}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (contact: Contact) => (
        <StatusBadge status={getContactoPipelineEstado(contact)} map={CONTACTO_STATUS_STYLES} className="px-2 py-0.5" />
      ),
    },
    {
      key: 'colheita',
      header: 'Colheita prevista',
      render: (contact: Contact) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs tabular-nums">
          {contact.data_colheita_prevista ? formatCalendarDatePt(contact.data_colheita_prevista) : '—'}
        </span>
      ),
    },
    {
      key: 'data_nascimento',
      header: 'Data Nascimento',
      render: (contact: Contact) => (
        <div>
          <div className="text-slate-700 dark:text-slate-200">{formatCalendarDatePt(contact.data_nascimento)}</div>
          <div className="text-slate-400 dark:text-slate-500 text-[11px]">{calculateAge(contact.data_nascimento)} anos</div>
        </div>
      ),
    },
    {
      key: 'genero',
      header: 'Genero',
      render: (contact: Contact) => (
        <span className={`px-2 py-0.5 rounded-full ${contact.genero === 'Masculino' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : contact.genero === 'Feminino' ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`} style={{ fontSize: '12px' }}>
          {contact.genero}
        </span>
      ),
    },
    {
      key: 'nif',
      header: 'NIF',
      render: (contact: Contact) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{contact.nif || '—'}</span>,
    },
    {
      key: 'telemovel',
      header: 'Telemovel',
      render: (contact: Contact) => <span className="text-slate-700 dark:text-slate-300">{contact.telemovel || '—'}</span>,
    },
    {
      key: 'acoes',
      header: 'Acoes',
      align: 'right' as const,
      render: (contact: Contact) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openView(contact)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors" title="Ver detalhes"><Eye className="w-4 h-4" /></button>
          {canUpdate && <button onClick={() => openEdit(contact)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>}
          {canDelete && <button onClick={() => handleDelete(contact.id, contact.nome)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className={PAGE.shell} style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={PAGE.body}>
        <PageHeader title={t('pages.contacts.title')} subtitle={t('pages.contacts.subtitle')} />

        {!canCreate && !canUpdate && !canDelete && <ReadOnlyNotice />}

        <FilterBar
          searchValue={searchTerm}
          onSearchChange={(v) => { setSearchTerm(v); resetPage(); }}
          searchPlaceholder={t('pages.contacts.searchPlaceholder')}
          chips={estadoChips}
          activeChipId={estadoFilter || undefined}
          onChipClick={(id) => { setEstadoFilter(id as ContactoFiltroEstado | ''); resetPage(); }}
          advancedCount={generoFilter ? 1 : 0}
          onClearAdvanced={() => { setGeneroFilter(''); resetPage(); }}
          advanced={(
            <select
              name="contacts-genero"
              value={generoFilter}
              onChange={(e) => { setGeneroFilter(e.target.value); resetPage(); }}
              className={CONTROL.input}
            >
              <option value="">Todos os géneros</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
            </select>
          )}
          right={(
            <div className="flex items-center gap-2">
              <ViewModeToggle
                value={view}
                onChange={setView}
                items={[
                  { id: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
                  { id: 'table', label: 'Tabela', icon: Table2 },
                ]}
              />
              {canCreate && (
                <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.create.contact')}</span>
                </button>
              )}
            </div>
          )}
        />

        {view === 'pipeline' ? (
          <ContactPipeline
            contacts={filtered}
            visibleEstados={estadoFilter ? [estadoFilter] : undefined}
            onOpen={openView}
            onEdit={(c) => openEdit(c)}
          />
        ) : (
          <div className={PANEL.table}>
            {filtered.length === 0 ? (
              <EmptyState icon={Users} title="Sem contactos" description="Nao ha contactos que correspondam aos filtros atuais." />
            ) : (
              <>
                <div className="hidden md:block">
                  <DataTable columns={contactColumns} data={paginated} />
                </div>

                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map(contact => {
                    const estado = getContactoPipelineEstado(contact);
                    return (
                      <div key={contact.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 dark:text-blue-400" style={{ fontSize: '12px', fontWeight: 600 }}>
                                {contact.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '14px', fontWeight: 500 }}>{contact.nome}</div>
                              <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>{contact.email || contact.telemovel || '—'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button onClick={() => openView(contact)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                            {canUpdate && <button onClick={() => openEdit(contact)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 ml-12">
                          {estado && <StatusBadge status={estado} map={CONTACTO_STATUS_STYLES} className="px-2 py-0.5" />}
                          {contact.data_colheita_prevista && (
                            <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                              Colheita: {formatCalendarDatePt(contact.data_colheita_prevista)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {start + 1}–{Math.min(start + itemsPerPage, filtered.length)} de {formatNumber(filtered.length)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition">
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>
                    <span className="px-2 text-xs text-slate-500 tabular-nums">{currentPage}/{totalPages}</span>
                    <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition">
                      Seguinte <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className={LAYOUT.kpiGrid}>
          <KpiCard label="Em contacto" value={contactosPreProcesso.length} icon={Users} tone="brand" />
          <KpiCard label="Agendados" value={agendados} icon={UserCheck} tone="warning" />
          <KpiCard label="Novos este mês" value={novosEsteMes} icon={UserPlus} tone="success" />
        </div>
      </div>
    </div>
  );
}
