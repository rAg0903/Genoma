import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router';

import { Plus, Edit, Trash2, Loader2, Stethoscope } from 'lucide-react';

import { toast } from 'sonner';

import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';

import { Medico, medicosApi } from '../../lib/api-medicos';

import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useLanguage } from '../../i18n/LanguageContext';

import { StatusBadge } from './shared/StatusBadge';

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



export function MedicosTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {

  const navigate = useNavigate();
  const confirmDelete = useConfirmDelete();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');

  const [medicos, setMedicos] = useState<Medico[]>([]);

  const [loading, setLoading] = useState(true);



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const list = await medicosApi.list();

      setMedicos(list);

    } catch {

      setMedicos([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => { void load(); }, [load]);



  const filtered = medicos.filter((m) => {

    const q = search.toLowerCase();

    return !q || [m.nome, m.titulo, m.especialidade, m.email, m.num_ordem, m.telefone_movel].some((v) => (v || '').toLowerCase().includes(q));

  });



  const handleDelete = async (m: Medico) => {

    const label = [m.titulo, m.nome].filter(Boolean).join(' ');

    if (!(await confirmDelete(deleteTargetLabel('o médico', label)))) return;

    try {

      await medicosApi.remove(m.utilizador_id);

      toast.success('Médico eliminado.');

      await load();

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar o médico.');

    }

  };



  return (

    <div className="space-y-4">

      <AdminTabToolbar

        search={search}

        onSearchChange={setSearch}

        placeholder="Pesquisar médicos..."

        searchName="search-medicos"

        action={canCreate ? (

          <button type="button" onClick={() => navigate('/definicoes/medicos/novo')} className={ADD_ACTION_BUTTON_CLASS}>

            <Plus className="w-4 h-4" /> {t('common.create.doctor')}

          </button>

        ) : undefined}

      />



      <AdminTabPanel>

        {loading ? (

          <div className="flex items-center justify-center py-12 text-slate-400">

            <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar médicos…

          </div>

        ) : filtered.length === 0 ? (

          <div className="py-16 text-center">

            <Stethoscope className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />

            <p className="text-slate-500" style={{ fontSize: '15px', fontWeight: 500 }}>Sem médicos encontrados</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className={ADMIN_TABLE_HEAD_CLASS}>

                <tr>

                  {['Nome', 'Especialidade', 'Cédula', 'Email', 'Telemóvel', 'Entidades', 'Estado', 'Ações'].map((h) => (

                    <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>

                      {h}

                    </AdminTableHeadCell>

                  ))}

                </tr>

              </thead>

              <tbody className={ADMIN_TABLE_BODY_CLASS}>

                {filtered.map((m) => (

                  <tr key={m.utilizador_id} className={ADMIN_TABLE_ROW_CLASS}>

                    <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">

                      {[m.titulo, m.nome].filter(Boolean).join(' ')}

                    </td>

                    <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{m.especialidade || '—'}</td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{m.num_ordem || '—'}</td>

                    <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{m.email}</td>

                    <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{m.telefone_movel || m.telefone_fixo || '—'}</td>

                    <td className="px-4 py-3 text-[13px] text-slate-500">{m.locais_trabalho?.length || 0}</td>

                    <td className="px-4 py-3">

                      <StatusBadge status={m.ativo ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />

                    </td>

                    <td className="px-4 py-3">

                      <AdminRowActions>

                        {canUpdate && (

                          <button type="button" onClick={() => navigate(`/definicoes/medicos/${m.utilizador_id}/editar`)} className={ADMIN_ACTION_BTN_CLASS}>

                            <Edit className="w-4 h-4" />

                          </button>

                        )}

                        {canDelete && (

                          <button type="button" onClick={() => void handleDelete(m)} className={ADMIN_DELETE_BTN_CLASS}>

                            <Trash2 className="w-4 h-4" />

                          </button>

                        )}

                      </AdminRowActions>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </AdminTabPanel>

    </div>

  );

}


