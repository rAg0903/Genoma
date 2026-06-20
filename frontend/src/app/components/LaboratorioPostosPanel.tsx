import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
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
import { StatusBadge } from './shared/StatusBadge';

type Props = {
  laboratorioId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

function AtivoBadge({ ativo }: { ativo: boolean }) {
  return <StatusBadge status={ativo ? 'Ativo' : 'Inativo'} map={ADMIN_ATIVO_STATUS_MAP} />;
}

export function LaboratorioPostosPanel({ laboratorioId, canCreate, canUpdate, canDelete }: Props) {
  const navigate = useNavigate();
  const { postos, deletePosto, refreshPostos } = useData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    void refreshPostos();
  }, [laboratorioId, refreshPostos]);

  const filtered = useMemo(
    () => postos
      .filter((p) => p.laboratorio_id === laboratorioId)
      .filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()) || (p.codigo || '').toLowerCase().includes(search.toLowerCase())),
    [postos, laboratorioId, search],
  );

  const handleDelete = async (postoId: string, nome: string) => {
    if (!confirm(`Eliminar posto ${nome}?`)) return;
    try {
      await deletePosto(postoId);
      toast.success('Posto eliminado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível eliminar o posto.');
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar postos..."
        searchName="search-lab-postos"
        action={canCreate ? (
          <button
            type="button"
            onClick={() => navigate(`/definicoes/laboratorios/${laboratorioId}/postos/novo`)}
            className={ADD_ACTION_BUTTON_CLASS}
          >
            <Plus className="w-4 h-4" /> Novo Posto
          </button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>
                {['Nome', 'Código', 'Cidade', 'Contacto', 'Estado', 'Ações'].map((h) => (
                  <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>{h}</AdminTableHeadCell>
                ))}
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum posto associado a este laboratório.
                  </td>
                </tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{p.nome}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {p.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{p.cidade}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{p.contacto}</td>
                  <td className="px-4 py-3"><AtivoBadge ativo={p.ativo !== false} /></td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => navigate(`/definicoes/laboratorios/${laboratorioId}/postos/${p.id}/editar`)}
                          className={ADMIN_ACTION_BTN_CLASS}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(p.id, p.nome)}
                          className={ADMIN_DELETE_BTN_CLASS}
                        >
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
      </AdminTabPanel>
    </div>
  );
}
